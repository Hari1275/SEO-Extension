const stopWords = new Set([
  'a',
  'about',
  'above',
  'after',
  'again',
  'against',
  'all',
  'am',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'before',
  'being',
  'below',
  'between',
  'both',
  'but',
  'by',
  'could',
  'did',
  'do',
  'does',
  'doing',
  'down',
  'during',
  'each',
  'few',
  'for',
  'from',
  'further',
  'had',
  'has',
  'have',
  'having',
  'he',
  'her',
  'here',
  'hers',
  'herself',
  'him',
  'himself',
  'his',
  'how',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'itself',
  'just',
  'me',
  'more',
  'most',
  'my',
  'myself',
  'no',
  'nor',
  'not',
  'now',
  'of',
  'off',
  'on',
  'once',
  'only',
  'or',
  'other',
  'our',
  'ours',
  'ourselves',
  'out',
  'over',
  'own',
  's',
  'same',
  'she',
  'should',
  'so',
  'some',
  'such',
  't',
  'than',
  'that',
  'the',
  'their',
  'theirs',
  'them',
  'themselves',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'to',
  'too',
  'under',
  'until',
  'up',
  'very',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'you',
  'your',
  'yours',
  'yourself',
  'yourselves',
]);

function extractProfessionalKeywords(text, maxKeywords = 10) {
  // Tokenize the text
  const tokens = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];

  // Filter out stop words
  const filteredTokens = tokens.filter((token) => !stopWords.has(token));

  // Count word frequencies
  const wordCounts = filteredTokens.reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});

  // Calculate a simple TF-IDF-like score
  const totalWords = filteredTokens.length;
  const scores = Object.entries(wordCounts).map(([word, count]) => {
    const tf = count / totalWords;
    const idf = Math.log(totalWords / (count + 1)); // Adding 1 to avoid division by zero
    return { word, count, score: tf * idf };
  });

  // Sort by score and take top keywords
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, maxKeywords)
    .map(({ word, count, score }) => ({
      word,
      count,
      score: score.toFixed(4),
    }));
}

function analyzeSEO() {
  console.log('Analyzing SEO...');
  const title = document.title;
  const metaDescription =
    document.querySelector('meta[name="description"]')?.content || '';
  const bodyContent = document.body.innerText;

  const seoData = {
    title: title,
    metaDescription: metaDescription,
    h1Tags: document.getElementsByTagName('h1').length,
    h2Tags: document.getElementsByTagName('h2').length,
    imgWithoutAlt: Array.from(document.querySelectorAll('img:not([alt])')).map(
      (img) => ({
        src: img.src,
        dimensions: `${img.width}x${img.height}`,
      })
    ),
    internalLinks: document.querySelectorAll(
      'a[href^="/"], a[href^="' + window.location.origin + '"]'
    ).length,
    externalLinks: document.querySelectorAll(
      'a[href^="http"]:not([href^="' + window.location.origin + '"])'
    ).length,
    socialTags: {
      ogTitle:
        document.querySelector('meta[property="og:title"]')?.content || '',
      ogDescription:
        document.querySelector('meta[property="og:description"]')?.content ||
        '',
      ogImage:
        document.querySelector('meta[property="og:image"]')?.content || '',
      twitterCard:
        document.querySelector('meta[name="twitter:card"]')?.content || '',
    },
    keywords: extractProfessionalKeywords(
      `${title} ${metaDescription} ${bodyContent}`
    ),
  };

  console.log('SEO analysis completed, sending message');
  chrome.runtime.sendMessage(
    { action: 'seoDataReady', data: seoData },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
      } else {
        console.log('Message sent successfully, response:', response);
      }
    }
  );
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === 'analyzeSEO') {
    analyzeSEO();
    sendResponse({ status: 'Analysis started' });
  }
  return true;
});
