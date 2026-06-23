import Link from "next/link";

export default function NotFound(){return <div className="narrow"><div className="panel" style={{textAlign:"center",padding:50}}><p className="eyebrow">404</p><h1>找不到这个页面</h1><p className="muted">内容可能已下架、订单不存在，或你没有查看权限。</p><Link className="button gold" href="/">返回首页</Link></div></div>}
