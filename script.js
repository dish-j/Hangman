// script.js - Hangman Game Logic with Python Flask API Call

// --- Game State Variables ---
let chosenWord = ""; // The word the user needs to guess for the current game
let lives = 6;       // Remaining lives for the current game
let guessedLetters = []; // Letters the user has already guessed in the current game
let gameOver = false;    // Flag to track the current game state (win or loss)

// --- DOM Element References ---
// Get references to HTML elements to update their content or attach event listeners
const wordDisplay = document.getElementById('word-display');
const livesMessage = document.getElementById('lives-message');
const guessedLettersDisplay = document.getElementById('guessed-letters');
const guessInput = document.getElementById('guess-input');
const guessButton = document.getElementById('guess-button');
const gameMessage = document.getElementById('game-message');
const playAgainButton = document.getElementById('play-again-button');
const hangmanFigure = document.getElementById('hangman-figure');


// --- Hangman Visual Stages (ASCII Art Representation) ---
// An array where each element represents a stage of the hangman figure,
// corresponding to the number of incorrect guesses made.
const hangmanStages = [
    `
      +---+
      |   |
          |
          |
          |
          |
    =========`, // 0 incorrect guesses (6 lives left)
    `
      +---+
      |   |
      O   |
          |
          |
          |
    =========`, // 1 incorrect guess (5 lives left)
    `
      +---+
      |   |
      O   |
      |   |
          |
          |
    =========`, // 2 incorrect guesses (4 lives left)
    `
      +---+
      |   |
      O   |
     /|   |
          |
          |
    =========`, // 3 incorrect guesses (3 lives left)
    `
      +---+
      |   |
      O   |
     /|\\  |
          |
          |
    =========`, // 4 incorrect guesses (2 lives left)
    `
      +---+
      |   |
      O   |
     /|\\  |
     /    |
          |
    =========`, // 5 incorrect guesses (1 life left)
    `
      +---+
      |   |
      O   |
     /|\\  |
     / \\  |
          |
    =========`, // 6 incorrect guesses (0 lives left - game over)
];

// --- Fallback Word List ---
// This list is used only if the Python backend API (app.py) fails to provide a word.
// Ensures the game can always start.
const fallbackWords = [
    "FALLBACK", "DEBUG", "DEFAULT", "CANVAS", "PROJECT", "GEMINI", "CODING",
    "DEVELOPER", "JAVASCRIPT", "PYTHON", "HTML", "CSS", "FLASK", "SERVER"
];

// --- Game Functions ---

/**
 * Fetches a random word from the local Python Flask API backend.
 * Includes robust error handling and falls back to a local list if the API call fails.
 */
async function fetchRandomWord() {
    // The URL where your Flask backend (app.py) should be running
    const apiUrl = 'https://hangman-0zn1.onrender.com/api/random_word';
    try {
        console.log(`Attempting to fetch word from: ${apiUrl}`);
        const response = await fetch(apiUrl); // Make HTTP request to Flask API
        
        // Check if the HTTP response was successful (status code 200-299)
        if (!response.ok) {
            // If not successful, throw an error with the status
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json(); // Parse the JSON response
        
        // Ensure the data structure is as expected (e.g., { "word": "RANDOMWORD" })
        if (data && data.word) {
            console.log("Word received from Python API:", data.word);
            return data.word.toUpperCase(); // Convert to uppercase for consistency
        } else {
            // If API returns valid JSON but not the expected word field
            throw new Error("API response missing 'word' field or malformed data.");
        }
    } catch (error) {
        // Log the error for debugging purposes
        console.error('Could not fetch word from Python Flask API:', error);
        
        // If API call fails (network issue, server down, etc.), use a random word from the fallback list
        const randomFallbackWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
        console.warn(`Falling back to local word: ${randomFallbackWord}`);
        return randomFallbackWord.toUpperCase();
    }
}

/**
 * Initializes a new game or resets the current game state.
 * This function is asynchronous because it calls `fetchRandomWord()`.
 */
async function initializeGame() {
    // Reset game state variables
    lives = 6;
    guessedLetters = [];
    gameOver = false;
    
    // Clear and reset UI elements
    gameMessage.textContent = "";
    guessInput.value = "";
    guessInput.disabled = false; // Enable input field
    guessButton.disabled = false; // Enable guess button
    playAgainButton.classList.add('hidden'); // Hide "Play Again" button
    // No score input area to hide anymore

    // Fetch a new word for the game from the Python backend
    chosenWord = await fetchRandomWord();
    
    // Update the UI to reflect the initial game state
    updateUI();
}

/**
 * Updates the word display with dashes for unguessed letters and reveals guessed letters.
 * @returns {string} The current displayed word (e.g., "_ P P L _").
 */
function updateWordDisplay() {
    let display = "";
    for (const char of chosenWord) {
        if (guessedLetters.includes(char)) {
            display += char + " "; // Show the letter if guessed
        } else {
            display += "_ ";      // Show a dash if not guessed
        }
    }
    wordDisplay.textContent = display.trim(); // Update the HTML element
    // Return the word without spaces or dashes for win condition check
    return display.trim().replace(/ /g, '');
}

/**
 * Updates the lives message, guessed letters display, and hangman figure.
 */
function updateUI() {
    livesMessage.textContent = `${lives} lives left!`; // Display remaining lives
    guessedLettersDisplay.textContent = guessedLetters.join(', '); // Display guessed letters, separated by commas
    hangmanFigure.textContent = hangmanStages[6 - lives]; // Update hangman ASCII art based on lives
    updateWordDisplay(); // Ensure the word display is also updated
}

/**
 * Handles the user's letter guess.
 * Processes the guess, updates game state, and triggers UI updates/game status checks.
 */
function handleGuess() {
    if (gameOver) return; // If game is over, do nothing

    let guess = guessInput.value.toUpperCase(); // Get input, convert to uppercase for case-insensitivity
    guessInput.value = ''; // Clear the input field immediately

    // Input validation: Must be a single letter (A-Z)
    if (!guess || guess.length !== 1 || !/^[A-Z]$/.test(guess)) {
        gameMessage.textContent = "Please enter a single letter (A-Z).";
        gameMessage.className = "text-3xl font-bold mt-6 text-yellow-400"; // Warning color
        setTimeout(() => gameMessage.textContent = "", 2000); // Clear message after 2 seconds
        return;
    }

    // Check if the letter has already been guessed
    if (guessedLetters.includes(guess)) {
        gameMessage.textContent = `You already guessed "${guess}". Try another letter!`;
        gameMessage.className = "text-3xl font-bold mt-6 text-yellow-400"; // Warning color
        setTimeout(() => gameMessage.textContent = "", 2000);
        return;
    }

    // Add the valid new guess to the list of guessed letters and sort it
    guessedLetters.push(guess);
    guessedLetters.sort();

    // Check if the guessed letter is in the chosen word
    if (chosenWord.includes(guess)) {
        gameMessage.textContent = `Good guess! "${guess}" is in the word.`;
        gameMessage.className = "text-3xl font-bold mt-6 text-green-400"; // Success message color
    } else {
        lives--; // Decrement lives if guess is incorrect
        gameMessage.textContent = `"${guess}" is not in the word. You lost a life!`;
        gameMessage.className = "text-3xl font-bold mt-6 text-red-400"; // Mistake message color
    }

    updateUI(); // Update the visual display
    checkGameStatus(); // Check if the game has ended (win or loss)
}

/**
 * Checks the current game status (win or loss) and performs end-game actions.
 */
function checkGameStatus() {
    // Get the current state of the displayed word (without spaces or dashes)
    const currentWordState = updateWordDisplay().replace(/ /g, '');

    if (currentWordState === chosenWord) {
        // Game Won
        gameMessage.textContent = "Congratulations! You won the game!";
        gameMessage.className = "text-3xl font-bold mt-6 text-lime-400"; // Win color
        gameOver = true;
        // No score input area to show
    } else if (lives <= 0) {
        // Game Lost
        gameMessage.textContent = `Game Over! The word was "${chosenWord}".`;
        gameMessage.className = "text-3xl font-bold mt-6 text-red-600"; // Loss color
        gameOver = true;
    }

    // If game is over (win or loss), disable input/guess button and show "Play Again"
    if (gameOver) {
        guessInput.disabled = true;
        guessButton.disabled = true;
        playAgainButton.classList.remove('hidden');
    }
}


// --- Event Listeners ---
// Attach event listeners to buttons and input field

// When the "Guess" button is clicked
guessButton.addEventListener('click', handleGuess);

// When the Enter key is pressed in the guess input field
guessInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission behavior (if any)
        handleGuess(); // Process the guess
    }
});

// When the "Play Again" button is clicked
playAgainButton.addEventListener('click', initializeGame);

// --- Initial Setup ---
// This ensures that the game initializes only after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', initializeGame);
