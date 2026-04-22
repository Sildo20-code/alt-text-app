(() => {
  function firstContent(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) {
        continue;
      }

      const content =
        element.getAttribute('content') ||
        element.getAttribute('src') ||
        element.getAttribute('href') ||
        element.textContent;

      if (content && content.trim()) {
        return content.trim();
      }
    }

    return '';
  }

  function getProductTitle() {
    return firstContent([
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      '[itemprop="name"]',
      'h1',
      '.product-title',
      '.product_name',
      '.product__title',
      'title'
    ]);
  }

  function getProductImage() {
    const metaImage = firstContent([
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '[itemprop="image"]',
      '.product img',
      '.product-image img',
      '.product__image img',
      'main img'
    ]);

    if (metaImage) {
      return metaImage;
    }

    const images = Array.from(document.images)
      .filter((image) => image.src && image.width >= 200 && image.height >= 200)
      .sort((left, right) => right.width * right.height - left.width * left.height);

    return images[0]?.src || '';
  }

  function getMetaDescription() {
    return firstContent([
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]'
    ]);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'GET_PAGE_CONTEXT') {
      return false;
    }

    sendResponse({
      url: window.location.href,
      title: getProductTitle(),
      description: getMetaDescription(),
      imageUrl: getProductImage(),
    });

    return false;
  });
})();
