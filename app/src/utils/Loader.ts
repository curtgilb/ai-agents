const loadingChars = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];
let loadingIndex = 0;
let loadingInterval: NodeJS.Timeout | null = null; // Declare loadingInterval outside the function

export function showLoading() {
    loadingInterval = setInterval(() => { // Assign the interval to the variable
        process.stdout.write(`\r${loadingChars[loadingIndex]} Thinking...`);
        loadingIndex = (loadingIndex + 1) % loadingChars.length;
    }, 100);

    return function stopLoading() {
        if (loadingInterval) {
            clearInterval(loadingInterval);
            loadingInterval = null; // Clear the interval variable
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        }
    }
}
