let seoData = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in popup:', request);
  if (request.action === 'seoDataReady') {
    console.log('SEO data received:', request.data);
    seoData = request.data;
    displaySEOData(seoData);
    sendResponse({ status: 'Data received successfully' });
  }
  return true; // Keeps the message channel open for asynchronous responses
});

function displaySEOData(data) {
  console.log('Displaying SEO data:', data);
  const resultsDiv = document.getElementById('seoResults');
  const keywordsDiv = document.getElementById('keywordsList');
  const missedImagesDiv = document.getElementById('missedImages');
  const suggestionsDiv = document.getElementById('contentSuggestions');
  const readabilityScore = calculateReadabilityScore(
    data.title + ' ' + data.metaDescription
  );
  const readabilitySuggestion = getReadabilitySuggestion(readabilityScore);

  suggestionsDiv.innerHTML = `
    <h3><i class="fas fa-lightbulb icon"></i>Content Improvement Suggestions</h3>
    <div class="readability-score">
      <h4>Readability Score: ${readabilityScore.toFixed(2)}</h4>
      <p>${readabilitySuggestion}</p>
    </div>
    <ul>
      ${generateContentSuggestions(
        data,
        readabilityScore,
        readabilitySuggestion
      )
        .map((suggestion) => `<li>${suggestion}</li>`)
        .join('')}
    </ul>
  `;

  resultsDiv.innerHTML = `
    ${createSEOItem(
      'Title',
      data.title,
      getTitleLengthCondition(data.title.length),
      'fa-heading'
    )}
    ${createSEOItem(
      'Meta Description',
      data.metaDescription || 'Missing!',
      getMetaDescriptionLengthCondition(
        data.metaDescription ? data.metaDescription.length : 0
      ),
      'fa-align-left'
    )}
    ${createSEOItem(
      'H1 Tags',
      data.h1Tags,
      data.h1Tags !== 1 ? 'warning' : 'good',
      'fa-h1'
    )}
    ${createSEOItem(
      'H2 Tags',
      data.h2Tags,
      data.h2Tags < 2 ? 'warning' : 'good',
      'fa-h2'
    )}
    ${createSEOItem(
      'Images without alt',
      data.imgWithoutAlt.length,
      data.imgWithoutAlt.length > 0 ? 'bad' : 'good',
      'fa-image'
    )}
    ${createSEOItem('Internal Links', data.internalLinks, '', 'fa-link')}
    ${createSEOItem(
      'External Links',
      data.externalLinks,
      '',
      'fa-external-link-alt'
    )}
  `;

  // Add keywords list
  keywordsDiv.innerHTML = `
    <h3><i class="fas fa-tags icon"></i>Top Keywords</h3>
    <div class="keywords-list">
      ${data.keywords
        .map((k) => `<span class="keyword-item">${k.word} (${k.count})</span>`)
        .join('')}
    </div>
  `;

  // Add missed images list
  missedImagesDiv.innerHTML = `
    <h3><i class="fas fa-image icon"></i>Images Missing Alt Text</h3>
    ${
      data.imgWithoutAlt.length > 0
        ? `<div class="missed-images-list">
            ${data.imgWithoutAlt
              .map(
                (img, index) => `
              <div class="missed-image-item">
                <div class="missed-image-url">
                  <span title="${img.src}">${img.src}</span>
                  <button class="btn copy-btn" data-url="${img.src}">Copy</button>
                  <button class="btn view-btn" data-url="${img.src}">View</button>
                </div>
                <div class="missed-image-dimensions">
                  <i class="fas fa-arrows-alt icon"></i>${img.dimensions}
                </div>
              </div>
            `
              )
              .join('')}
          </div>`
        : '<p>No images missing alt text. Great job!</p>'
    }
  `;

  // Add event listeners for copy and view buttons
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(this.dataset.url).then(() => {
        this.textContent = 'Copied!';
        setTimeout(() => {
          this.textContent = 'Copy';
        }, 2000);
      });
    });
  });

  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      chrome.tabs.create({ url: this.dataset.url });
    });
  });

  // Update event listeners for collapsible sections
  document.querySelectorAll('.section-header').forEach((header) => {
    header.addEventListener('click', function () {
      this.classList.toggle('active');
      const content = this.nextElementSibling;
      content.style.display =
        content.style.display === 'block' ? 'none' : 'block';

      const icon = this.querySelector('.fas');
      icon.classList.toggle('fa-chevron-down');
      icon.classList.toggle('fa-chevron-up');

      if (
        content.id === 'keywordsList' &&
        content.style.display === 'block' &&
        seoData
      ) {
        setTimeout(() => {
          createKeywordsChart(seoData);
        }, 100);
      }
    });
  });

  // Add event listener for export button
  document.getElementById('exportBtn').addEventListener('click', function () {
    console.log('Export button clicked');
    if (seoData) {
      console.log('Exporting SEO data');
      exportResults(seoData);
    } else {
      console.error('No SEO data available for export');
    }
  });

  // Move the chart creation here, after the DOM has been updated
  if (seoData && seoData.keywords && seoData.keywords.length > 0) {
    setTimeout(() => {
      createKeywordsChart(seoData);
    }, 0);
  }
}

function generateContentSuggestions(
  data,
  readabilityScore,
  readabilitySuggestion
) {
  const suggestions = [];
  suggestions.push(readabilitySuggestion);

  const titleSuggestion = getTitleLengthSuggestion(data.title.length);
  suggestions.push(
    `Title (${data.title.length} characters): ${titleSuggestion}`
  );

  const metaDescriptionSuggestion = getMetaDescriptionLengthSuggestion(
    data.metaDescription.length
  );
  suggestions.push(
    `Meta description (${data.metaDescription.length} characters): ${metaDescriptionSuggestion}`
  );

  if (data.h1Tags !== 1) {
    suggestions.push(
      'Ensure your page has exactly one H1 tag for proper heading structure.'
    );
  } else {
    suggestions.push(
      'Good job! Your page has one H1 tag, which is ideal for SEO.'
    );
  }

  if (data.h2Tags < 2) {
    suggestions.push(
      'Consider adding more H2 tags to improve content structure and readability.'
    );
  } else {
    suggestions.push(
      `Great! Your page has ${data.h2Tags} H2 tags, which helps with content structure.`
    );
  }

  if (data.imgWithoutAlt.length > 0) {
    suggestions.push(
      `Add alt text to ${data.imgWithoutAlt.length} image(s) for better accessibility and SEO.`
    );
  } else {
    suggestions.push(
      'Excellent! All images have alt text, which is great for accessibility and SEO.'
    );
  }

  if (data.keywords.length > 0) {
    suggestions.push(
      `Focus on your top keywords: ${data.keywords
        .slice(0, 3)
        .map((k) => k.word)
        .join(', ')}.`
    );
  }

  return suggestions;
}

function getTitleLengthSuggestion(length) {
  if (length < 30) {
    return 'Consider making your title longer (aim for 30-60 characters) to potentially improve SEO performance.';
  } else if (length > 60) {
    return 'Consider shortening your title (aim for 30-60 characters) to avoid potential truncation in search results.';
  } else {
    return 'Great job! Your title length looks good for SEO.';
  }
}

function getMetaDescriptionLengthSuggestion(length) {
  if (length < 120) {
    return 'Consider making your meta description longer (aim for 120-160 characters) to provide more context and potentially improve click-through rates.';
  } else if (length > 160) {
    return 'Consider shortening your meta description (aim for 120-160 characters) to avoid potential truncation in search results.';
  } else {
    return 'Excellent! Your meta description length looks good for SEO.';
  }
}

function getTitleLengthCondition(length) {
  if (length < 30 || length > 60) {
    return 'warning';
  }
  return 'good';
}

function getMetaDescriptionLengthCondition(length) {
  if (length === 0) {
    return 'bad';
  } else if (length < 120 || length > 160) {
    return 'warning';
  }
  return 'good';
}

function calculateReadabilityScore(text) {
  const words = text.trim().split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const syllables = text.split(/[aeiou]/i).length - 1;
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

function getReadabilitySuggestion(score) {
  if (score > 90) return 'The text is very easy to read. Great job!';
  if (score > 80) return 'The text is easy to read. Well done!';
  if (score > 70) return 'The text is fairly easy to read. Good work!';
  if (score > 60)
    return 'The text is of standard/average difficulty. Consider simplifying it slightly.';
  if (score > 50)
    return 'The text is fairly difficult to read. Try to simplify your language.';
  return 'The text is difficult to read. Consider rewriting with simpler language for better accessibility.';
}

function exportResults(data) {
  console.log('Starting export process');
  // Calculate readability score
  const readabilityScore = calculateReadabilityScore(
    data.title + ' ' + data.metaDescription
  );
  const readabilitySuggestion = getReadabilitySuggestion(readabilityScore);

  // Generate content suggestions
  const contentSuggestions = generateContentSuggestions(
    data,
    readabilityScore,
    readabilitySuggestion
  );

  console.log('Creating workbook');
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([]);

  // Add SEO data
  XLSX.utils.sheet_add_json(
    ws,
    [
      {
        title: data.title,
        metaDescription: data.metaDescription,
        h1Tags: data.h1Tags,
        h2Tags: data.h2Tags,
        imagesWithoutAlt: data.imgWithoutAlt.length,
        internalLinks: data.internalLinks,
        externalLinks: data.externalLinks,
        topKeywords: data.keywords
          .slice(0, 5)
          .map((k) => `${k.word} (${k.count})`)
          .join(', '),
        readabilityScore: readabilityScore.toFixed(2),
      },
    ],
    { origin: 'A1' }
  );

  // Add Content Improvement Suggestions
  XLSX.utils.sheet_add_json(
    ws,
    [
      {
        'Content Improvement Suggestions':
          'The following suggestions are based on the analysis:',
      },
    ],
    { origin: -1 }
  );
  XLSX.utils.sheet_add_json(
    ws,
    contentSuggestions.map((suggestion) => ({
      'Content Improvement Suggestions': suggestion,
    })),
    { origin: -1, skipHeader: true }
  );

  // Add missed image URLs
  XLSX.utils.sheet_add_json(
    ws,
    [{ 'Missed Image URLs': 'The following images are missing alt text:' }],
    { origin: -1 }
  );
  XLSX.utils.sheet_add_json(
    ws,
    data.imgWithoutAlt.map((img) => ({ 'Missed Image URLs': img.src })),
    { origin: -1, skipHeader: true }
  );

  XLSX.utils.book_append_sheet(wb, ws, 'SEO Analysis');

  console.log('Getting chart canvas');
  // Get the chart canvas
  const chartCanvas = document.getElementById('keywordsChart');

  if (chartCanvas) {
    console.log('Chart canvas found, creating zip file');
    // Convert chart to base64 image
    const chartImage = chartCanvas.toDataURL('image/png');

    // Create a zip file containing Excel and chart image
    const zip = new JSZip();
    zip.file(
      'seo_analysis_results.xlsx',
      XLSX.write(wb, { bookType: 'xlsx', type: 'base64' }),
      { base64: true }
    );
    zip.file('keywords_chart.png', chartImage.split('base64,')[1], {
      base64: true,
    });

    zip.generateAsync({ type: 'blob' }).then(function (content) {
      console.log('Zip file generated, initiating download');
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'seo_analysis_results.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  } else {
    console.log('Chart canvas not found, exporting Excel file only');
    // If chart doesn't exist, just export Excel file
    XLSX.writeFile(wb, 'seo_analysis_results.xlsx');
  }
}

function analyzePage() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    console.log('Current tab:', tabs[0]);

    if (tabs[0].url.startsWith('chrome://')) {
      document.getElementById('seoResults').innerHTML =
        '<p>SEO analysis is not available on chrome:// pages.</p>';
      return;
    }

    // First, inject the content script
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        files: ['content.js'],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            'Error injecting script:',
            chrome.runtime.lastError.message
          );
          document.getElementById(
            'seoResults'
          ).innerHTML = `<p>Error: ${chrome.runtime.lastError.message}</p>`;
        } else {
          // Now that the script is injected, send the message
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: 'analyzeSEO' },
            function (response) {
              if (chrome.runtime.lastError) {
                console.error(
                  'Error sending message:',
                  chrome.runtime.lastError.message
                );
                document.getElementById(
                  'seoResults'
                ).innerHTML = `<p>Error: ${chrome.runtime.lastError.message}</p>`;
              } else {
                console.log('Analysis started:', response);
              }
            }
          );
        }
      }
    );
  });
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('Popup DOM fully loaded');
  initializeUI();
  analyzePage();
});

function initializeUI() {
  // Initialize section toggles
  document.querySelectorAll('.section-header').forEach((header) => {
    header.addEventListener('click', function () {
      this.classList.toggle('active');
      const content = this.nextElementSibling;
      content.style.display =
        content.style.display === 'block' ? 'none' : 'block';

      const icon = this.querySelector('.fas');
      icon.classList.toggle('fa-chevron-down');
      icon.classList.toggle('fa-chevron-up');

      if (
        content.id === 'keywordsList' &&
        content.style.display === 'block' &&
        seoData
      ) {
        setTimeout(() => {
          createKeywordsChart(seoData);
        }, 100);
      }
    });
  });
}

function createKeywordsChart(data) {
  console.log('Creating keywords chart');
  console.log('Chart object available:', typeof Chart !== 'undefined');
  let ctx = document.getElementById('keywordsChart');

  if (!ctx) {
    console.log('Canvas not found, creating dynamically');
    const keywordsDiv = document.getElementById('keywordsList');
    const canvas = document.createElement('canvas');
    canvas.id = 'keywordsChart';
    keywordsDiv.appendChild(canvas);
    ctx = canvas;
  }

  console.log('Chart context:', ctx);
  console.log('Keywords data:', data.keywords);

  if (ctx && data.keywords && data.keywords.length > 0) {
    try {
      // Destroy existing chart if it exists
      if (window.keywordsChart instanceof Chart) {
        window.keywordsChart.destroy();
      }

      window.keywordsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.keywords.slice(0, 5).map((k) => k.word),
          datasets: [
            {
              label: 'Keyword Frequency',
              data: data.keywords.slice(0, 5).map((k) => k.count),
              backgroundColor: '#3498db',
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
      chartCreated = true;
      console.log('Chart created successfully');

      // Add event listener for export button
      const exportBtn = document.getElementById('exportChartBtn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => exportChart(ctx));
      }
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  } else {
    console.log('Unable to create chart. Context or data missing.');
    console.log('ctx:', ctx);
    console.log('keywords:', data.keywords);
  }
}

function exportChart(canvas) {
  const imageData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imageData;
  link.download = 'keywords_chart.png';
  link.click();
}

function createSEOItem(label, value, condition, icon) {
  return `
    <div class="seo-item">
      <span class="label"><i class="fas ${icon} icon"></i>${label}</span>
      <span class="value ${condition}">${value}</span>
    </div>
  `;
}

function createSEOItem(label, value, condition, icon) {
  return `
    <div class="seo-item">
      <span class="label"><i class="fas ${icon} icon"></i>${label}</span>
      <span class="value ${condition}">${value}</span>
    </div>
  `;
}
