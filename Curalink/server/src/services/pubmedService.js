// server/src/services/pubmedService.js
const axios = require('axios');

const BASE  = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const KEY   = process.env.NCBI_API_KEY ? `&api_key=${process.env.NCBI_API_KEY}` : '';

const searchPubMed = async (query, retmax = 100) => {
  const url = `${BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${retmax}&sort=pub+date&retmode=json${KEY}`;
  const { data } = await axios.get(url);
  return data.esearchresult.idlist || [];
};

const fetchPubMedDetails = async (ids) => {
  if (!ids.length) return [];
  const url = `${BASE}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml${KEY}`;
  const { data } = await axios.get(url);
  return parsePubMedXML(data);
};

const parsePubMedXML = (xml) => {
  const results = [];
  const articles = xml.match(/[sS]*?/g) || [];

  articles.forEach(article => {
    const get = (tag) => {
      const m = article.match(new RegExp(`<${tag}[^>]*>([\s\S]*?)`));
      return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
    };
    const pmid    = get('PMID');
    const title   = get('ArticleTitle');
    const abs     = get('AbstractText');
    const year    = get('PubDate').match(/d{4}/)?.[0] || '0';
    const authors = [...article.matchAll(/([^<]+)/g)]
      .map(m => m[1]).slice(0, 3);

    if (title) results.push({
      title, abstract: abs, authors,
      year: parseInt(year),
      source: 'pubmed',
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
    });
  });
  return results;
};

const getPubMedPublications = async (query, retmax = 100) => {
  const ids = await searchPubMed(query, retmax);
  return fetchPubMedDetails(ids);
};

module.exports = { getPubMedPublications };