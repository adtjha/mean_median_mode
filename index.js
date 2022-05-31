const express = require('express')
const path = require('path');
const app = express()
const port = process.env.PORT || 3000;

app.use(express.urlencoded({
    extended: true
}))

app.get('/', (req, res) => {
    // check login if true
    // res.redirect('/enter');
    // if false
    res.redirect('/login');
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/register.html'));
})

app.post('/register', (req, res) => {
    res.send(req.body)
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/login.html'));
})

app.post('/login', (req, res) => {
    res.send(req.body)
})

app.get('/enter', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/dataEntry.html'));
})

app.post('/numbers', (req, res) => {
    const numbersObj = req.body
    let numbers = Object.values(numbersObj);
    numbers = numbers.map(e => parseFloat(e))
    console.log(numbers)

    // calulate mean
    const sumOfAllValues = numbers.reduce((a, b) => a + b);
    const totalNumbers = numbers.length;

    const mean = sumOfAllValues / totalNumbers;

    // calulate median

    const reArrangedNumbers = numbers.sort((a, b) => a > b ? 1 : -1);
    let median;

    if (totalNumbers % 2 === 0) {
        // even
        median = (reArrangedNumbers[(totalNumbers / 2)] + reArrangedNumbers[(totalNumbers / 2) - 1]) / 2;
    } else {
        // odd
        median = reArrangedNumbers[Math.floor((totalNumbers / 2))];
    }

    // calculate mode
    let repeatedNumbers = {}, mode = [], max;
    numbers.forEach((n, i, arr) => {
        const present = arr.filter(e => e === n);
        if (present.length > 1) {
            repeatedNumbers[n] = present.length;
        }
    });

    if (Object.values(repeatedNumbers) > 0) {
        max = Object.values(repeatedNumbers).sort((a, b) => b - a)[0]

        Object.entries(repeatedNumbers).forEach(([number, occurence]) => {
            if (occurence === max) {
                console.log(`push ${number}`)
                mode.push(number);
            }
        })
    } else {
        mode = [...numbers]
    }


    console.log({ repeatedNumbers, max })
    console.log({ mean, median, mode })
    res.send({ mean, median, mode })
})

app.get('/results', (req, res) => {

    res.sendFile(path.join(__dirname, '/pages/results.html'));
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
