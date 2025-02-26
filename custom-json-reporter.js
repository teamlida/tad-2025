const fs = require('fs');


class CustomJsonReporter {
    constructor(options) {
        this.outputFile = options.outputFile || './playwright-report/custom-json-report.json';
        this.results = [];
        this.testType = '';
    }

    onBegin(config, suite) {
        this.startTime = Date.now();
    }

    onTestBegin(test) {
        console.info(`[${test.title}] TEST STARTED`);
        let suiteName = test.parent.title;
    }

    onTestEnd(test, result) {
        console.info(`[${test.title}] TEST ${result.status.toUpperCase()} ${result.error ? `:${result.error.message}` : ''}`);

        const existingTestIndex = this.results.findIndex(t => t.name === test.title);

        const testEntry = {
            name: test.title,
            passed: result.status === 'passed',
        };

        if (existingTestIndex !== -1) {
            this.results[existingTestIndex] = testEntry;
        } else {
            this.results.push(testEntry);
        }
    }

    async onEnd(result) {
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