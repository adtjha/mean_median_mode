import express from 'express'
import path from 'path'
import dotenv from "dotenv";
import crypto, { verify } from 'crypto'
import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import pug from 'pug'
import cookieParser from "cookie-parser"
import sessions from 'express-session'

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const port = process.env.PORT || 3000;

app.use(sessions({
    secret: "1223ccbd7d49a90866c3c49f99d55e87897686fcd63d9082a09b2cf16ce47c48",
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    resave: false
}))

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))

app.use(cookieParser());

const file = join(__dirname, 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)

await db.read()

db.data ||= { users: {} }

const { users } = db.data

let session;

app.get('/', (req, res) => {
    // check login if true
    // res.redirect('/enter');
    // if false
    session = req.session;
    if (session.user) {
        res.redirect('/enter')
    } else {
        res.redirect('/login');
    }
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/register.html'));
})

app.post('/register', async (req, res) => {
    try {
        const { name, mail, password } = req.body;

        if (!(name && mail && password)) throw Error('Input Parameters improper.')

        const salt = crypto.randomBytes(6).toString('hex')
        const hashedPass = crypto.createHash('sha256').update(`${password}${salt}`, 'utf-8').digest('hex')

        users[mail] = { name, mail, hashedPass, salt };

        await db.write()

        session = req.session;
        session.user = req.body.name;
    } catch (error) {
        res.send(pug.renderFile('./pages/templates/register.pug', { error: error.message }))
        return
    }
    res.redirect('/enter')
    return
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/login.html'));
})

app.post('/login', (req, res, next) => {
    const { mail, password } = req.body;

    try {
        if (!(mail && password)) throw Error('Input Required.')

        // check if user exsits
        const user = users[mail]
        if (!user) throw Error('No User Found')

        // check if password matches
        const hashedPass = crypto.createHash('sha256').update(`${password}${user.salt}`, 'utf-8').digest('hex')
        if (hashedPass === user.hashedPass) {
            session = req.session;
            session.user = users[mail].name;
            res.redirect('/enter')
        } else {
            next({ hashedPass, user: user.hashedPass })
        }
    } catch (error) {
        res.send(pug.renderFile('./pages/templates/login.pug', { error: error.message }))
        return
    }
    // redirect to /enter
    next()
})

const verifyUser = (req, res, next) => {
    session = req.session;
    if (session.user) {
        next()
    } else {
        res.redirect('/login');
    }
}

app.get('/enter', verifyUser, (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/dataEntry.html'));
})

app.post('/numbers', verifyUser, (req, res) => {
    const numbersObj = req.body
    let numbers = Object.values(numbersObj);
    numbers = numbers.map(e => parseFloat(e))
    numbers = numbers.filter(e => !isNaN(e))
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

    console.log({ repeatedNumbers })

    if (Object.values(repeatedNumbers).length > 0) {
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

    res.send(pug.renderFile('./pages/templates/result.pug', { mean, median, mode: mode.join(', ') }))
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
