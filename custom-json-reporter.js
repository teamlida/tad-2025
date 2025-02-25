const fs = require('fs');
const { request } = require('@playwright/test');

class CustomJsonReporter {
  constructor(options) {
    this.outputFile = options.outputFile || './playwright-report/custom-report.json';
    this.results = [];
    this.promises = [];
  }

  onBegin(config, suite) {
    this.startTime = Date.now();
  }

  onTestBegin(test) {
    console.info(`[${test.title}] TEST STARTED`);
  }

  onTestEnd(test, result) {
    console.info(`[${test.title}] TEST ${result.status.toUpperCase()} ${result.error ? `:${result.error.message}` : ''}`);

    const testEntry = {
      name: test.title,
      passed: result.status === 'passed',
    };

        if (result.status === 'failed' ) {
            const errorMessage = result.error.message;
            
            testEntry.failureReason = result.error.message;
        }

        if (existingTestIndex !== -1) {
            this.results[existingTestIndex] = testEntry;
        } else {
            this.results.push(testEntry);
        }
    }

  async onEnd(result) {
    // Wait for all AI-generated failure reasons to be resolved
    await Promise.all(this.promises);

    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    // Save test results to file
    const rawTestResults = { testResults: this.results };
    fs.writeFileSync(this.outputFile, JSON.stringify(rawTestResults, null, 2));

    console.log(`Test execution completed in ${totalDuration}ms`);
  }

  onStdOut(chunk, test, result) {
    if (test) {
      process.stdout.write(`[${test.title}] ${chunk}`);
    } else {
      process.stdout.write(chunk);
    }
  }

  onStdErr(chunk, test, result) {
    if (test) {
      process.stderr.write(`[${test.title}] ${chunk}`);
    } else {
      process.stderr.write(chunk);
    }
  }
}

async function generateFailReasonAI(failureReason) {
  const apiContext = await request.newContext();
  const response = await apiContext.post('http://localhost:11434/api/generate', {
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      model: 'llama3.2',
      prompt: `In up to 5 words, explain why this test failed: ${failureReason}`,
      temperature: 0,
      max_tokens: 10, // limits the response length if the API supports it
      stream: false,
    },
  });

  const responseBody = await response.json();
  console.log('Response from LLM:', responseBody);
  await apiContext.dispose();

  return responseBody.response;
}

module.exports = CustomJsonReporter;
