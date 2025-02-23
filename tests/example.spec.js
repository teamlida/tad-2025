const { test, expect, request } = require('@playwright/test');

test('has title', async ({ page }) => {
  await page.goto('https://teamlida.github.io/tad-2025/');
  await expect(page).toHaveTitle(/Coffee Ordering System/);
});

test('create order', async ({ page }) => {
  await page.goto('https://teamlida.github.io/tad-2025/');
  await page.click('#order-coffee');

  await expect(page.locator('#message')).toContainText('order has been placed successfully');
});

test('create order - caramel macchiatto', async ({ page }) => {
  await page.goto('https://teamlida.github.io/tad-2025/');

  await page.selectOption('#coffee-type', 'Caramel Machiatto');

  const selectedValue = await page.locator('#coffee-type').evaluate(el => el.value);
  console.log(`Selected coffee type: ${selectedValue}`); 

  await expect(selectedValue).toBe('caramel-machiatto');

  await page.click('#order-coffee');

  await expect(page.locator('#message')).toContainText('order has been placed successfully');
});

test('api call to llm', async ({}) => {
  const apiContext = await request.newContext();

  const response = await apiContext.post('http://localhost:11434/api/generate', {
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      model: 'llama3.2',
      prompt: 'What is the capital of the Netherlands?',
      stream: false,
    },
  });

  const responseBody = await response.json();
  console.log('Response from LLM:', responseBody);

  await expect(responseBody.response).toContain('Amsterdam');

  await apiContext.dispose();
});
