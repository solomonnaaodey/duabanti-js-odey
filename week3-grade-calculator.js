// Default scores if none are provided from the command line
const defaultScores = [90, 43, 78, 40, 55, 61, 49];

// Get scores from process.argv
const inputScores = process.argv.slice(2).map(Number);

// Use command-line scores if provided, otherwise use default scores
const scores = inputScores.length > 0 ? inputScores : defaultScores;

// GetGrade funtion: Returns a grade and letter
function getGrade(score) {
    if (score >= 90) {
        return "A";
    } else if (score >= 80) {
        return "B";
    } else if (score >= 70) {
        return "C";
    } else if (score >= 50) {
        return "D";
    } else {
        return "F";
    }
}



// Returns the average of an array of scores
function average(scores) {
    if (scores.length === 0) {
        return 0;
    }

    let total = 0;

    for (let score of scores) {
        total += score;
    }

    return total / scores.length;
}


// Returns true if score is between 0 and 100 inclusive
function isValidScore(score) {
    return score >= 0 && score <= 100;
}


const validScores = [];

console.log("Results:");

for (let score of scores) {
    if (isValidScore(score)) {
        console.log(`${score} -> ${getGrade(score)}`);
        validScores.push(score);
    } else {
        console.log(`${score} is invalid and was skipped`);
    }
}

console.log(`Average: ${average(validScores).toFixed(2)}`);



