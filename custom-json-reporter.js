const fs = require('fs');
const { request } = require('@playwright/test');


class CustomJsonReporter {
    constructor(options) {
        this.outputFile = options.outputFile || './playwright-report/custom-json-report.json';
        this.results = [];
        this.testType = '';
        this.promises = [];
    }

    onBegin(config, suite) {
        this.startTime = Date.now();
    }

    onTestBegin(test) {
        console.info(`[${test.title}] TEST STARTED`);
        let suiteName = test.parent.title;
    }

    async onTestEnd(test, result) {
        console.info(`[${test.title}] TEST ${result.status.toUpperCase()} ${result.error ? `:${result.error.message}` : ''}`);

        const existingTestIndex = this.results.findIndex(t => t.name === test.title);

        const testEntry = {
            name: test.title,
            passed: result.status === 'passed',
            failureReason: null
        };

        if (result.status === 'failed') {
            testEntry.failureReason = result.error.message;

            const apiPromise = request.newContext().then(async apiContext => {
                return apiContext.post('http://localhost:11434/api/generate', {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    data: {
                        model: "llama3.2",
                        prompt: "Summarize the error message to a short and human readable form: " + testEntry.failureReason,
                        stream: false
                    } 
                });
            }).then(async response => {
            return response.json();
        }).then(responseBody => {       
            console.log("LLM RESPONSE:", responseBody);
            testEntry.failureReason = responseBody.response;
        }).catch(error => {
            console.error(error);
        }); 

            this.promises.push(apiPromise);
        }


        if (existingTestIndex !== -1) {
            this.results[existingTestIndex] = testEntry;
        } else {
            this.results.push(testEntry);
        }
    }

    async onEnd(result) {
        await Promise.all(this.promises);

        const endTime = Date.now();
        const totalDuration = endTime - this.startTime;

        // save test results to file
        const rawTestResults = { testResults: this.results };
        fs.writeFileSync(this.outputFile, JSON.stringify(rawTestResults, null, 2));

        // you can add logic here to send the results somewhere, i.e. in DB
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
            process.stderr.write(`[${test.title}]  ${chunk}`);
        } else {
            process.stderr.write(chunk);
        }
    }
}

module.exports = CustomJsonReporter;