const fs = require('fs');
const path = require('path');
const binary = require('node-pre-gyp');
const bindingPath = process.env.NODE_PRINTER_BINDING_PATH || binary.find(path.resolve(path.join(__dirname, '../package.json')));
let printerHelper;

if (fs.existsSync(bindingPath))
{
    printerHelper = require(bindingPath);
}
else
{
    printerHelper = require(`./bindings/node_printer_${process.platform}_${process.arch}.node`);
}

/** Return all installed printers including active jobs
 */
module.exports.getPrinters = getPrinters;

/** Send data to printer
 */
module.exports.printDirect = printDirect;

// / send file to printer
module.exports.printFile = printFile;

/** Get supported print format for printDirect
 */
module.exports.getSupportedPrintFormats = printerHelper.getSupportedPrintFormats;

/**
 * Get possible job command for setJob. It depends on os.
 * @return Array of string. e.g.: DELETE, PAUSE, RESUME
 */
module.exports.getSupportedJobCommands = printerHelper.getSupportedJobCommands;

/** Get printer info object. It includes all active jobs
 */
module.exports.getPrinter = getPrinter;
module.exports.getSelectedPaperSize = getSelectedPaperSize;
module.exports.getPrinterDriverOptions = getPrinterDriverOptions;

// / Return default printer name
module.exports.getDefaultPrinterName = getDefaultPrinterName;

/** Get printer job info object
 */
module.exports.getJob = getJob;
module.exports.setJob = setJob;

/**
 * Return user defined printer, according to https://www.cups.org/documentation.php/doc-2.0/api-cups.html#cupsGetDefault2 :
 * "Applications should use the cupsGetDests and cupsGetDest functions to get the user-defined default printer,
 * as this function does not support the lpoptions-defined default printer"
 */
function getDefaultPrinterName()
{
    const printerName = printerHelper.getDefaultPrinterName();
    if (printerName)
    {
        return printerName;
    }

    // Seems correct posix behaviour
    const printers = getPrinters();
    if (printers && printers.length)
    {
        for (const printer of printers)
        {
            if (printer.isDefault === true)
            {
                return printer.name;
            }
        }
    }

    // Printer not found, return nothing(undefined)
}

/** Get printer info with jobs
 * @param printerName printer name to extract the info
 * @return printer object info:
 *		TODO: to enum all possible attributes
 */
function getPrinter(printerName)
{
    if (!printerName)
    {
        printerName = getDefaultPrinterName();
    }
    const printer = printerHelper.getPrinter(printerName);
    correctPrinterinfo(printer);
    return printer;
}

/** Get printer driver options includes advanced options like supported paper size
 * @param printerName printer name to extract the info (default printer used if printer is not provided)
 * @return printer driver info:
 */
function getPrinterDriverOptions(printerName)
{
    if (!printerName)
    {
        printerName = getDefaultPrinterName();
    }

    return printerHelper.getPrinterDriverOptions(printerName);
}

/** Finds selected paper size pertaining to the specific printer out of all supported ones in driverOptions
 * @param printerName printer name to extract the info (default printer used if printer is not provided)
 * @return selected paper size
 */
function getSelectedPaperSize(printerName)
{
    const driverOptions = getPrinterDriverOptions(printerName);
    let selectedSize = '';
    if (driverOptions && driverOptions.PageSize)
    {
        Object.keys(driverOptions.PageSize).forEach((key) =>
        {
            if (driverOptions.PageSize[key])
                selectedSize = key;
        });
    }
    return selectedSize;
}

function getJob(printerName, jobId)
{
    return printerHelper.getJob(printerName, jobId);
}

function setJob(printerName, jobId, command)
{
    return printerHelper.setJob(printerName, jobId, command);
}

function getPrinters()
{
    const printers = printerHelper.getPrinters();
    if (printers && printers.length)
    {
        for (const printer of printers)
        {
            correctPrinterinfo(printer);
        }
    }
    return printers;
}

function correctPrinterinfo(printer)
{
    if (printer.status || !printer.options || !printer.options['printer-state'])
    {
        return;
    }

    let status = printer.options['printer-state'];
    // Add posix status
    if (status === '3')
    {
        status = 'IDLE';
    }
    else if (status === '4')
    {
        status = 'PRINTING';
    }
    else if (status === '5')
    {
        status = 'STOPPED';
    }

    // Correct date type
    let k;
    for (k in printer.options)
    {
        if (/time$/.test(k) && printer.options[k] && !(printer.options[k] instanceof Date))
        {
            printer.options[k] = new Date(printer.options[k] * 1000);
        }
    }

    printer.status = status;
}

/*
 Print raw data. This function is intend to be asynchronous

 parameters:
 parameters - Object, parameters objects with the following structure:
 data - String, mandatory, data to printer
 printer - String, optional, name of the printer, if missing, will try to print to default printer
 docname - String, optional, name of document showed in printer status
 type - String, optional, only for wind32, data type, one of the RAW, TEXT
 options - JS object with CUPS options, optional
 success - Function, optional, callback function
 error - Function, optional, callback function if exists any error

 or

 data - String, mandatory, data to printer
 printer - String, optional, name of the printer, if missing, will try to print to default printer
 docname - String, optional, name of document showed in printer status
 type - String, optional, data type, one of the RAW, TEXT
 options - JS object with CUPS options, optional
 success - Function, optional, callback function with first argument job_id
 error - Function, optional, callback function if exists any error
 */
function printDirect(...args)
{
    let data = args,
        printer,
        docname,
        type,
        options,
        success,
        error;

    if (args.length === 1)
    {
        const parameters = args[0];
        // TODO: check parameters type
        // if (typeof parameters )
        data = parameters.data;
        printer = parameters.printer;
        docname = parameters.docname;
        type = parameters.type;
        options = parameters.options || {};
        success = parameters.success;
        error = parameters.error;
    }
    else
    {
        printer = args[1];
        type = args[2];
        docname = args[3];
        options = args[4];
        success = args[5];
        error = args[6];
    }

    if (!type)
    {
        type = 'RAW';
    }

    // Set default printer name
    if (!printer)
    {
        printer = getDefaultPrinterName();
    }

    type = type.toUpperCase();

    if (!docname)
    {
        docname = 'node print job';
    }

    if (!options)
    {
        options = {};
    }

    // TODO: check parameters type
    if (printerHelper.printDirect)
    {// Call C++ binding
        try
        {
            const res = printerHelper.printDirect(data, printer, docname, type, options);
            if (res)
            {
                success(res);
            }
            else
            {
                error(Error('Something wrong in printDirect'));
            }
        }
        catch (e)
        {
            error(e);
        }
    }
    else
    {
        error('Not supported');
    }
}

/**
Parameters:
   parameters - Object, parameters objects with the following structure:
      filename - String, mandatory, data to printer
      docname - String, optional, name of document showed in printer status
      printer - String, optional, mane of the printer, if missed, will try to retrieve the default printer name
      success - Function, optional, callback function
      error - Function, optional, callback function if exists any error
*/
function printFile(parameters)
{
    let docname,
        printer,
        success,
        error;

    if ((arguments.length !== 1) || (typeof(parameters) !== 'object'))
    {
        throw new Error('must provide arguments object');
    }

    const filename = parameters.filename;
    docname = parameters.docname;
    printer = parameters.printer;
    const options = parameters.options || {};
    success = parameters.success;
    error = parameters.error;

    if (!success)
    {
        success = function(){};
    }

    if (!error)
    {
        error = function(err)
        {
            throw err;
        };
    }

    if (!filename)
    {
        const err = new Error('must provide at least a filename');
        return error(err);
    }

    // Try to define default printer name
    if (!printer)
    {
        printer = getDefaultPrinterName();
    }

    if (!printer)
    {
        return error(new Error('Printer parameter of default printer is not defined'));
    }

    // Set filename if docname is missing
    if (!docname)
    {
        docname = filename;
    }

    // TODO: check parameters type
    if (printerHelper.printFile)
    {// Call C++ binding
        try
        {
            // TODO: proper success/error callbacks from the extension
            const res = printerHelper.printFile(filename, docname, printer, options);

            if (!isNaN(parseInt(res)))
            {
                success(res);
            }
            else
            {
                error(Error(res));
            }
        }
        catch (err)
        {
            error(err);
        }
    }
    else
    {
        error('Not supported');
    }
}
