// Re-mounts on every navigation, giving each page a soft entrance.
export default function Template({ children }) {
  return <div className="page-enter">{children}</div>;
}
