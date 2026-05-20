import Link from "next/link";
import { BeadStudio } from "@/components/studio/BeadStudio";

export default function StudioPage() {
  return (
    <main>
      <header className="site-header">
        <div className="container nav-row">
          <Link href="/" className="brand">
            拼豆配色图生成器
          </Link>
          <nav className="nav-links">
            <Link href="/studio">工作台</Link>
            <Link href="/help">使用说明</Link>
          </nav>
        </div>
      </header>
      <BeadStudio />
    </main>
  );
}
