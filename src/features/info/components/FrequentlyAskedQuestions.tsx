export default function FrequentlyAskedQuestions() {
  return (
    <div>
      <h3>Frequently Asked Questions</h3>
      <div className="mb-6">
        <p className="font-semibold text-gray-900 mb-1">How do I contact a human?</p>
        <div className="text-gray-700">
          We only have humans here. You can write us at{" "}
          <a href="mailto:henslowescloud@gmail.com">henslowescloud@gmail.com</a>
        </div>
      </div>
      <div className="mb-6">
        <p className="font-semibold text-gray-900 mb-1">
          Why do you use Google login? Do I have to?
        </p>
        <div className="text-gray-700">
          We're using Google login because it's free and secure. It keeps us
          from having to keep track of your password or manage password resets
          and security.
        </div>
      </div>
      <div className="mb-6">
        <p className="font-semibold text-gray-900 mb-1">Who can see my personal info?</p>
        <div className="text-gray-700">
          It depends on the kind of job they have and how it relates to yours.
          <ul>
            <li>
              <strong>Only you can edit your info.</strong>
            </li>
            <li>
              <strong>
                People who are currently working on a production or at a theater
                with you can see:
              </strong>
              <ul>
                <li>Your phone number</li>
                <li>Your schedule conflicts</li>
                <li>Your rehearsal schedule</li>
              </ul>
            </li>
            <li>
              <strong>
                People with administrative jobs on a production or at a theater
                where you are working or have worked can see:
              </strong>
              <ul>
                <li>Your address</li>
                <li>Your emergency contact info</li>
                <li>Your legal name</li>
                <li>Your birthdate</li>
              </ul>
            </li>
            <li>
              <strong>
                People who have worked with you, or are currently working with
                you, on a production or at a theater can see:
              </strong>
              <ul>
                <li>Your email</li>
              </ul>
            </li>
            <li>
              <strong>Everyone can see:</strong>
              <ul>
                <li>Your preferred name</li>
                <li>Your name as it will appear in show programs</li>
                <li>Your website</li>
                <li>Your gender</li>
                <li>Your description</li>
                <li>Your bio</li>
                <li>Your timezone</li>
                <li>
                  Your current and past jobs in participating theaters
                  (including casting)
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
      <div className="mb-6">
        <p className="font-semibold text-gray-900 mb-1">
          What counts as an administrative job?
        </p>
        <div className="text-gray-700">
          <div>
            This may change as we refine our system. At the moment,
            administrative job titles are as follows.
          </div>
          <div>
            <strong>For theaters:</strong>
            <ul>
              <li>Executive Director</li>
              <li>Artistic Director</li>
              <li>Technical Director</li>
              <li>
                Theater Admin (generally, whoever created the theater within
                Henslowe's Cloud)
              </li>
            </ul>
          </div>
          <div>
            <strong>For productions:</strong>
            <ul>
              <li>Producer</li>
              <li>Director</li>
              <li>Stage Manager</li>
              <li>
                Production Admin (generally, whoever created the production
                within Henslowe's Cloud)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
