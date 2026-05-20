import Link from "next/link";

const faqs = [
  {
    question: "支持哪些图片格式？",
    answer: "支持 JPG、PNG、WebP。建议上传主体清晰、对比度较高的图片。",
  },
  {
    question: "尺寸越大越好吗？",
    answer: "尺寸越大，细节越多，但制作颗数也会更多。建议先从 32 或 48 长边开始尝试。",
  },
  {
    question: "导出的图片里包含什么？",
    answer: "导出的 PNG 包含网格图、颜色编号、总颗数和每种颜色的用量统计。",
  },
  {
    question: "手机上能用吗？",
    answer: "可以，页面已按 H5 做响应式适配。图片预览和下载均可在手机浏览器中完成。",
  },
];

export default function HelpPage() {
  return (
    <main>
      <header className="site-header">
        <div className="container nav-row">
          <Link href="/" className="brand">
            拼豆配色图生成器
          </Link>
          <nav className="nav-links">
            <Link href="/studio">开始制作</Link>
            <Link href="/help">使用说明</Link>
          </nav>
        </div>
      </header>

      <section className="page-hero compact-hero">
        <div className="container narrow-container">
          <span className="eyebrow">使用说明</span>
          <h1>先看规则，再开始生成</h1>
          <p>
            当前版本默认使用内置拼豆色卡，并采用自动居中裁剪的方式处理图片。适合快速生成第一版制作图。
          </p>
        </div>
      </section>

      <section className="section-block">
        <div className="container narrow-container content-stack">
          <article className="content-card">
            <h2>推荐使用方式</h2>
            <ol className="ordered-list">
              <li>优先选择主体清晰、背景不太复杂的图片。</li>
              <li>先试较小尺寸，确认效果后再放大颗粒数。</li>
              <li>头像、宠物、Q 版插画通常比大场景照片更适合做拼豆图。</li>
              <li>如果裁剪不理想，可以先在外部工具裁图后再上传。</li>
            </ol>
          </article>

          <article className="content-card">
            <h2>当前版本说明</h2>
            <ul className="bullet-list">
              <li>默认内置一套基础拼豆色卡。</li>
              <li>自动匹配最接近颜色，不支持手动改单颗颜色。</li>
              <li>比例切换采用自动居中裁剪。</li>
              <li>下载格式为 PNG，不含 PDF 导出。</li>
            </ul>
          </article>

          <article className="content-card">
            <h2>常见问题</h2>
            <div className="faq-list">
              {faqs.map((faq) => (
                <div key={faq.question} className="faq-item">
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </div>
          </article>

          <div className="cta-inline">
            <Link href="/studio" className="primary-button">
              去生成拼豆图
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
