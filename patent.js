export function buildPatentSearch(query) {
  const cleaned = query.replace(/[<>]/g, " ").trim();
  const encoded = encodeURIComponent(cleaned);
  return {
    query: cleaned,
    googlePatentsUrl: `https://patents.google.com/xhr/query?url=q%3D${encoded}`,
    searchUrl: `https://patents.google.com/?q=${encoded}`,
    note: "This opens a keyword search. It is not a legal patentability or novelty opinion."
  };
}
