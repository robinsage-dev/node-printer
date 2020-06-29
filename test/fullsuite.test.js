const {expect} = require('chai');
const FileSystem = require('fs');
const Path = require('path');

const Printer = require('../printer');

const state = {};

describe('getPrinters', () =>
{
    it('gets the printers', () =>
    {
        const printers = Printer.getPrinters();
        expect(printers).to.be.instanceof(Array);
        state.printers = printers;
    });
});

describe('getDefaultPrinterName', () =>
{
    it('gets the name of the default printer', () =>
    {
        const printerName = Printer.getDefaultPrinterName();
        expect(printerName).to.be.a('string');
        state.printerName = printerName;
    });
});

describe('getPrinter', () =>
{
    it('gets a printer by name', () =>
    {
        for (const printer of state.printers)
        {
            expect(printer.name).to.be.a('string');
            const fetchedPrinter = Printer.getPrinter(printer.name);
            expect(fetchedPrinter).to.exist;
            expect(fetchedPrinter.constructor).to.equal(Object);
            expect(fetchedPrinter.name).to.equal(printer.name);
        }
    });

    it('returns the default printer if no name provided', () =>
    {
        const printer = Printer.getPrinter();
        expect(printer).to.exist;
        expect(printer.constructor).to.equal(Object);
        expect(printer.name).to.equal(state.printerName);
        state.printer = printer;
    });
});

describe('getSupportedPrintFormats', () =>
{
    it('gets the formats the OS supports', () =>
    {
        const printFormats = Printer.getSupportedPrintFormats();
        expect(printFormats).to.be.instanceof(Array);

        expect(printFormats.indexOf('RAW')).to.not.equal(-1);
        state.printFormats = printFormats;

        console.log('print formats', state.printFormats);
    });
});

describe('getSupportedJobCommands', () =>
{
    it('gets the supported job commands', () =>
    {
        const jobCommands = Printer.getSupportedJobCommands();
        expect(jobCommands).to.be.instanceof(Array);

        state.jobCommands = jobCommands;
        console.log('job commands', jobCommands);
    });
});

describe('getSelectedPaperSize', () =>
{
    it('returns the selected paper size', () =>
    {
        const paperSize = Printer.getSelectedPaperSize(state.printerName);
        expect(paperSize).to.be.a('string');
        console.log('paper size', paperSize);
        state.paperSize = paperSize;
    });
});

describe('getPrinterDriverOptions', () =>
{
    it('gets options supported by the printer', () =>
    {
        const driverOptions = Printer.getPrinterDriverOptions(state.printerName);
        expect(driverOptions).to.exist;
        expect(driverOptions.constructor).to.equal(Object);
        console.log('driver options', driverOptions);
        state.driverOptions = driverOptions;
    });
});

describe('printDirect', () =>
{
    // it('prints text', (done) =>
    // {
    //     Printer.printDirect({
    //         type: 'TEXT',
    //         data: Buffer.from('This is text'),
    //         printer: state.printerName,
    //         docname: `Print text test ${Date.now()}`,
    //         success(jobId)
    //         {
    //             state.textJobId = jobId;
    //             console.log('text job id', jobId, 'printer', state.printerName);
    //             done();
    //         },
    //         error(err)
    //         {
    //             done(err);
    //         },
    //     });
    // });

    // it('prints a pdf', (done) =>
    // {
    //     const pdfData = FileSystem.readFileSync(Path.resolve(__dirname, './data/sample.pdf'));
    //     Printer.printDirect({
    //         type: 'AUTO',
    //         data: pdfData,
    //         printer: state.printerName,
    //         docname: `Print pdf test ${Date.now()}`,
    //         success(jobId)
    //         {
    //             state.rawPdfJobId = jobId;
    //             console.log('text job id', jobId, 'printer', state.printerName);
    //             done();
    //         },
    //         error(err)
    //         {
    //             done(err);
    //         },
    //     });
    // });

    // it('prints a postscript raw', (done) =>
    // {
    //     const psData = FileSystem.readFileSync(Path.resolve(__dirname, './data/sample.ps'));
    //     Printer.printDirect({
    //         type: 'AUTO',
    //         data: psData,
    //         printer: state.printerName,
    //         docname: `Print postscript test ${Date.now()}`,
    //         success(jobId)
    //         {
    //             state.rawPdfJobId = jobId;
    //             console.log('ps job id', jobId, 'printer', state.printerName);
    //             done();
    //         },
    //         error(err)
    //         {
    //             done(err);
    //         },
    //     });
    // });

    it('prints a jpg raw', (done) =>
    {
        const jpgData = FileSystem.readFileSync(Path.resolve(__dirname, './data/sample.jpg'));
        Printer.printDirect({
            type: 'AUTO',
            data: jpgData,
            printer: state.printerName,
            docname: `Print postscript test ${Date.now()}`,
            success(jobId)
            {
                state.rawJpgJobId = jobId;
                console.log('jpg job id', jobId, 'printer', state.printerName);
                done();
            },
            error(err)
            {
                done(err);
            },
        });
    });
});

describe('getJob', () =>
{
    it('gets a job', () =>
    {
        const job = Printer.getJob(state.printerName, state.rawJpgJobId);
        expect(job).to.exist;
        expect(job.constructor).to.equal(Object);
        console.log('job', job);
    });
});
