import { Link } from "@tanstack/react-router"

export default function Help() {
  return (
    <div>
      Help & info here
      <ul>
        <li>
          <Link to="/getting-started">Getting Started</Link>
        </li>
        <li>
          <Link to="/faq">Frequently Asked Questions</Link>
        </li>
        <li>
          <a href="mailto:henslowescloud@gmail.com">Email me</a>{" "}
          (henslowescloud@gmail.com)! If you hit an error on a specific page,
          it's really helpful if you can copy and paste the URL from your
          browser to help me locate the problem, and give me some info on what
          you were trying to do.
        </li>
      </ul>
    </div>
  )
}
