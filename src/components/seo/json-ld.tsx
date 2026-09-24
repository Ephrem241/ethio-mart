import type { JsonLdNode } from "@/lib/seo/json-ld"

// Renders structured data as a <script type="application/ld+json"> tag
// (Next's recommended way, see docs "JSON-LD"). JSON.stringify does not
// escape "<", so a product name containing "</script>" could break out of the
// tag — every "<" is written as <, which JSON parsers read back as "<".
function JsonLd({ nodes }: { nodes: JsonLdNode[] }) {
  const data = { "@context": "https://schema.org", "@graph": nodes }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}

export { JsonLd }
