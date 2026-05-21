import { Link } from "@tanstack/react-router"
import { useAuth } from "../../../hooks/useAuth"
import { useSubscription } from "../../../hooks/useSubscription"

export default function GettingStarted() {
  const { user } = useAuth()
  const { isFree } = useSubscription()
  return (
    <div>
      <h3>Getting Started</h3>
      <ol className="list-decimal list-outside ml-6 space-y-3">
        {!user && (
          <li>
            Connect your Google login (if you haven't already). Just click the
            Google button at the top.
          </li>
        )}
        <li>
          To access all features, learn about{" "}
          <Link to={"/subscriptions" as never}>paid accounts</Link>.
        </li>
        <li>
          Go check that <Link to={"/account" as never}>your account information</Link> is
          up-to-date.
        </li>
        <li>
          To do nearly anything, you'll need to create a production. Productions
          happen in theaters. Start by{" "}
          <Link to="/theaters">selecting or creating the theater</Link>.{" "}
          {isFree && (
            <span>
              Free accounts can only work in their "dream theaters." However,
              productions from a dream theater can eventually be transfered to a
              real theater.
            </span>
          )}
        </li>
        <li>
          Once you have selected a theater, click the "Add new produciton"
          button right in the middle of the page. Select a play, and set the
          production dates to span from the earliest production meeting to the
          closing night. Don't see a play you're looking for?{" "}
          <a href="mailto:henslowescloud@gmail.com">Shoot us an email.</a> We
          can only provide play text tools for public domain plays, but we can
          manually add charts and tracks for other plays. Please contact us, and
          we'll set you right up.
        </li>
        <li>
          It can take a minute to set up a production—this is a one-time thing.
          The play title might render as "A Play" for a bit; reload the page if
          it is like that for more than a minute.
        </li>
        <li>
          For public domain plays, you can double click "lines per minute not
          yet set" to set your lpm, and have your run time automatically
          calculated.
        </li>
        <li>
          To play with casting, add some auditioners, and then use the "click to
          cast" interface to create a casting.
        </li>
        <li>
          Use "Show doubling charts" to take a look at whether your casting will
          cause you regret.
        </li>
        <li>
          Click on the play title at the top of the production page to explore
          the text more deeply. You can see breakdowns of acts, scenes, and
          french scenes, or organized by character. You also can add or remove
          characters, scenes, etc. If you click "Edit script," you can load a
          bit of text and work with it. You can use the buttons to cut entire
          lines, or double click a line for more fine-grained editing. You can
          double click a character name to assign a line to somebody else. The
          button at the top will allow you to show or hide the markup that
          displays what has been cut or added.
        </li>
        <li>
          From the production page, click "View full rehearsal schedule" to add
          some rehearsals. Choose "Edit rehearsal schedule" to add new
          rehearsals. Once you've created a rehearsal (or several--check out our
          pattern creator!), you can assign content or people to them.
        </li>
      </ol>
    </div>
  )
}
