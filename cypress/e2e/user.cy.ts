export {};

describe("User page", () => {
  beforeEach(() => {
    cy.seed();
  });

  it("views profile not logged in", function () {
    cy.visit("/u/79237403620945920");
    cy.contains("Sendou");
    cy.getCy("edit-page-link").should("not.exist");
  });

  it("edits own profile", function () {
    cy.intercept("/u/79237403620945920/edit?_data=routes%2Fu.%24identifier").as(
      "editPageData"
    );

    cy.auth();
    cy.visit("/");
    cy.getCy("user-avatar").click();
    cy.getCy("profile-button").click();
    cy.getCy("edit-page-link").click();
    cy.getCy("country-select").select("FI");

    const bio = "my cool bio :)";
    cy.getCy("bio-textarea").type(bio);

    cy.getCy("submit-button").click();
    cy.wait("@editPageData");

    cy.getCy("profile-page-link").click();
    cy.contains("Sendou");
    cy.contains("Finland");
    cy.contains(bio);

    // let's also check that clearing inputs is possible
    cy.getCy("edit-page-link").click();
    cy.getCy("country-select").select(0);
    cy.getCy("bio-textarea").clear();
    cy.getCy("submit-button").click();
    cy.wait("@editPageData");

    cy.getCy("profile-page-link").click();
    cy.contains("Sendou");
    cy.contains("Finland").should("not.exist");
    cy.contains(bio).should("not.exist");
  });

  it("changes big badge in badge container", () => {
    cy.visit("/u/79237403620945920");

    cy.getCy("small-badge").first().click();

    cy.getCy("badge-explanation")
      .invoke("text")
      .then((previousText) => {
        cy.getCy("small-badge").first().click();
        cy.getCy("badge-explanation")
          .invoke("text")
          .should("not.equal", previousText);
      });
  });
});
