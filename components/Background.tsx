// Renders the fixed mountain artwork behind every page. The actual image
// (mobile/desktop, light/dark) is chosen by plain CSS in globals.css, so
// this component has nothing to decide — it just needs to exist first in
// the page so everything else draws on top of it.
export default function Background() {
  return <div className="site-background" aria-hidden="true" />;
}
