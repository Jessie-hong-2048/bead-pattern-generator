import Link from "next/link";

const highlights = [
  {
    title: "自动拼豆配色",
    description: "自动裁剪、降采样并匹配最接近的拼豆颜色，快速得到可制作的配色网格。",
  },
  {
    title: "支持比例与尺寸",
    description: "支持原图比例、1:1、4:5、3:4、16:9 等比例，并可切换常用颗粒尺寸或自定义宽高。",
  },
  {
    title: "直接下载制作图",
    description: "导出 PNG 网格图，包含颜色编号、总颗数和每种颜色的用量统计。",
  },
];

const steps = [
  "上传 JPG、PNG、WebP 图片",
  "选择目标比例与拼豆尺寸",
  "自动生成拼豆网格图与配色统计",
  "下载 PNG 制作图，在电脑或手机上随时查看",
];

export default function Home() {
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

      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">公开网页工具 · PC / H5 自适应</span>
            <h1 className="hero-title">把图片一键转成可下载的拼豆配色网格图</h1>
            <p className="hero-description">
              上传图片后即可自动裁剪、降采样和匹配拼豆颜色，生成带颜色编号与用量统计的制作图。
            </p>
            <div className="hero-actions">
              <Link href="/studio" className="primary-button">
                上传图片开始制作
              </Link>
              <Link href="/help" className="secondary-button">
                查看使用说明
              </Link>
            </div>
            <ul className="hero-tags">
              <li>自动配色</li>
              <li>支持手机</li>
              <li>PNG 下载</li>
            </ul>
          </div>

          <div className="hero-card-grid">
            <article className="glass-card">
              <h2>输入图片</h2>
              <p>照片、插画、头像都可以上传</p>
            </article>
            <article className="glass-card accent-card">
              <h2>生成拼豆图</h2>
              <p>自动转换为网格与颜色编号</p>
            </article>
            <article className="glass-card">
              <h2>导出制作图</h2>
              <p>附带总颗数和每色用量统计</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">功能亮点</span>
            <h2>适合先上线验证的一版功能</h2>
          </div>
          <div className="feature-grid">
            {highlights.map((item) => (
              <article key={item.title} className="feature-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block alt-surface">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">使用流程</span>
            <h2>四步完成一张拼豆配色图</h2>
          </div>
          <div className="step-list">
            {steps.map((step, index) => (
              <article key={step} className="step-card">
                <span className="step-index">0{index + 1}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container cta-panel">
          <div>
            <span className="eyebrow">现在开始</span>
            <h2>直接进入工作台生成你的第一张拼豆图</h2>
            <p>支持电脑与手机浏览器，适合快速生成收藏图、头像图和像素风参考图。</p>
          </div>
          <Link href="/studio" className="primary-button">
            进入工作台
          </Link>
        </div>
      </section>
    </main>
  );
}
