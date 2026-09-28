const PROMISES = [
  { title: "Fitted to you", body: "Stitched to your saved measurements" },
  { title: "Bridal specialists", body: "From consultation to final trial" },
  { title: "Pay your way", body: "UPI, cards, netbanking or COD" },
  { title: "Studio pickup", body: "Collect free from Ernakulam" },
]

const PromiseStrip = () => (
  <section
    aria-label="Why shop with us"
    className="border-b border-janki-ink/10 bg-janki-paper-2"
  >
    <ul className="content-container grid grid-cols-2 small:grid-cols-4">
      {PROMISES.map((p, i) => (
        <li
          key={p.title}
          className={[
            "flex flex-col gap-1 px-4 py-6 border-janki-ink/10",
            i % 2 === 1 ? "border-l" : "",
            i >= 2 ? "border-t small:border-t-0 small:border-l" : "",
          ].join(" ")}
        >
          <span className="font-display text-[20px] text-janki-wine">
            {p.title}
          </span>
          <span className="text-[14px] text-janki-muted">{p.body}</span>
        </li>
      ))}
    </ul>
  </section>
)

export default PromiseStrip
