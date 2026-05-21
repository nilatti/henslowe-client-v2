import { Link } from '@tanstack/react-router'

export function Welcome() {
  return (
    <div>
      <div className="flex font-semibold text-xl md:hidden">
        Due to the text-heavy nature of these tools, they don't work well on
        mobile devices. You might want to switch to a computer.
      </div>
      <div className="py-2.5 [&_a]:font-semibold">
        This free service provides tools for cutting and doubling plays
        (currently only Shakespeare, but that may change). There will soon be an
        expanded set of tools for paying customers, including rehearsal
        scheduling support, auditioning tools, and other communication,
        dramaturgy, and stage management facilitation.
      </div>
      <div className="py-2.5 [&_a]:font-semibold">
        That version will also include the ability to download or save the
        output of all the tools that are available on this free version.
      </div>
      <div className="py-2.5 [&_a]:font-semibold">
        Along with being a useful device for directors, dramaturgs, and stage
        managers, Henslowe's Cloud is a companion tool for the forthcoming book{' '}
        <em>Cutting Plays for Performance</em>, by Aili Huber and Toby Malone,
        published by Routledge Press.
      </div>
      <div className="py-2.5 [&_a]:font-semibold">
        Don't want to miss a thing?{' '}
        <a
          href="https://7eb01415.sibforms.com/serve/MUIEAPtkNc7VuCZziNvBBGVHW75GdZrTeOpwd-qwIGqlwkveJ1K8FZQIbIC_81JW44D0OXXi2NkzmtvzW4ZixmsrvmBKKaVPt3EFuuDLUqwnO1HAYycKnH2EDOzBavq6W2wbDAqISyR2uEb_OTwjsZ8LCVh0B6Zzrfko1YFyEnTlTqqm2w71qQzMKaPdst9tMfNCSU8jXl0mTjDc"
          target="_blank"
          rel="noreferrer"
        >
          Sign up for our mailing list
        </a>{' '}
        to learn about the book's publication date and new features on this
        page. We promise we won't sell your info or spam you.
      </div>
      <div className="py-2.5">
        <strong>
          With the free version of our service, any changes you make will vanish
          as soon as you close your browser or switch which play you are working
          on. For more tools and the ability to save your work, please see our{' '}
          <Link to="/login">premium plans</Link>, coming soon!
        </strong>
      </div>
    </div>
  )
}
