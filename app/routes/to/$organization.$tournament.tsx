// TODO: 404 page that shows other tournaments by the organization

import {
  MetaFunction,
  LoaderFunction,
  LinksFunction,
  NavLink,
  Link,
} from "remix";
import { useLoaderData, Outlet, useLocation } from "remix";
import invariant from "tiny-invariant";
import { DiscordIcon } from "~/components/icons/Discord";
import { TwitterIcon } from "~/components/icons/Twitter";
import { getUser, makeTitle, useUser } from "~/utils";
import {
  findTournamentByNameForUrl,
  FindTournamentByNameForUrlI,
} from "~/services/tournament";
import tournamentStylesUrl from "../../styles/tournament.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tournamentStylesUrl }];
};

export const loader: LoaderFunction = ({ params, context }) => {
  invariant(
    typeof params.organization === "string",
    "Expected params.organization to be string"
  );
  invariant(
    typeof params.tournament === "string",
    "Expected params.tournament to be string"
  );

  const user = getUser(context);

  return findTournamentByNameForUrl({
    organizationNameForUrl: params.organization,
    tournamentNameForUrl: params.tournament,
    userId: user?.id,
  });
};

export const meta: MetaFunction = (props) => {
  const data = props.data as FindTournamentByNameForUrlI;

  return {
    title: makeTitle(data.name),
    //description: data.description ?? undefined,
  };
};

export default function TournamentPage() {
  const data = useLoaderData<FindTournamentByNameForUrlI>();
  const location = useLocation();

  const displayNavLinks =
    !location.pathname.endsWith("register") &&
    !location.pathname.endsWith("manage-roster");

  return (
    <div className="tournament__container">
      <InfoBanner />
      {displayNavLinks && (
        <div
          style={{ "--tabs-count": 5 } as Record<string, number>}
          className="tournament__links-container"
        >
          <NavLink className="tournament__nav-link" to="overview">
            Overview
          </NavLink>
          <NavLink className="tournament__nav-link" to="map-pool">
            Map Pool
          </NavLink>
          <NavLink className="tournament__nav-link" to="bracket">
            Bracket
          </NavLink>
          <NavLink className="tournament__nav-link" to="teams">
            Teams ({data.teams.length})
          </NavLink>
          <NavLink className="tournament__nav-link" to="streams">
            Streams (4)
          </NavLink>
        </div>
      )}
      <Outlet />
    </div>
  );
}

export function InfoBanner() {
  const data = useLoaderData<FindTournamentByNameForUrlI>();

  return (
    <>
      <div
        className="info-banner"
        style={
          {
            "--background": data.bannerBackground,
            // TODO: do this on backend
            "--text": `hsl(${data.bannerTextHSLArgs})`,
            // TODO: and this
            "--text-transparent": `hsla(${data.bannerTextHSLArgs}, 0.3)`,
          } as Record<string, string>
        }
      >
        <div className="info-banner__top-row">
          <div className="info-banner__top-row__date-name">
            <div className="info-banner__top-row__month-date">
              <div className="info-banner__top-row__month-date__month">
                {shortMonthName(data.startTime)}
              </div>
              <div className="info-banner__top-row__month-date__date">
                {dayNumber(data.startTime)}
              </div>
            </div>
            <div className="info-banner__top-row__tournament-name">
              {data.name}
            </div>
          </div>
          <div className="info-banner__icon-buttons-container">
            {data.organizer.twitter && (
              // TODO: broken on Safari
              <a
                className="info-banner__icon-button"
                href={data.organizer.twitter}
              >
                <TwitterIcon />
              </a>
            )}
            <a
              className="info-banner__icon-button"
              href={data.organizer.discordInvite}
            >
              <DiscordIcon />
            </a>
          </div>
        </div>
        <div className="info-banner__bottom-row">
          <div className="info-banner__bottom-row__infos">
            <div className="info-banner__bottom-row__info-container">
              <div className="info-banner__bottom-row__info-label">
                Starting time
              </div>
              <div>{weekdayAndStartTime(data.startTime)}</div>
            </div>
            <div className="info-banner__bottom-row__info-container">
              <div className="info-banner__bottom-row__info-label">Format</div>
              <div>Double Elimination</div>
            </div>
            <div className="info-banner__bottom-row__info-container">
              <div className="info-banner__bottom-row__info-label">
                Organizer
              </div>
              <div>{data.organizer.name}</div>
            </div>
          </div>
          <InfoBannerActionButton />
        </div>
      </div>
    </>
  );
}

// TODO: https://github.com/remix-run/remix/issues/656
function weekdayAndStartTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    weekday: "long",
    hour: "numeric",
  });
}

function shortMonthName(date: string) {
  return new Date(date).toLocaleString("en-US", { month: "short" });
}

function dayNumber(date: string) {
  return new Date(date).toLocaleString("en-US", { day: "numeric" });
}

function InfoBannerActionButton() {
  const data = useLoaderData<FindTournamentByNameForUrlI>();
  const user = useUser();
  const now = new Date();

  // TODO: special case - tournament has started but can manage roster
  const tournamentHasConcluded = new Date(data.startTime) < now;
  if (tournamentHasConcluded) return null;

  if (!user)
    return (
      <Link to="register" className="info-banner__action-button">
        Log in to register
      </Link>
    );

  const isAlreadyInATeamButNotCaptain = data.teams
    .flatMap((team) => team.members)
    .filter(({ captain }) => !captain)
    .some(({ member }) => member.id === user.id);
  if (isAlreadyInATeamButNotCaptain) return null;

  // TODO: check-in closes 10 minutes before? how is it set + add to logic
  const checkInIsOpen =
    new Date(data.checkInTime) < now && new Date(data.startTime) > now;
  if (checkInIsOpen) return <button>Check-in</button>;

  const alreadyRegistered = data.teams
    .flatMap((team) => team.members)
    .some(({ member }) => member.id === user.id);
  if (alreadyRegistered) {
    return (
      <Link to="manage-roster" className="info-banner__action-button">
        Manage roster
      </Link>
    );
  }

  return (
    <Link to="register" className="info-banner__action-button">
      Register
    </Link>
  );
}