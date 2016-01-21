console.log('Loading lexique sheet, please wait. It could take a while the first time you use this generator.');
var _                  = require('lodash');
var fs                 = require('fs');
var interestingColumns = [
    {
        name: 'spelling',
        column: 0
    }, {
        name: 'grammar',
        column: 3
    }
];

// If file lexique.json exists, we will use it, else we build it for the first time.
try {
    fs.accessSync(__dirname + '/../assets/lexique.json', fs.F_OK);
    var jsonfile = require('jsonfile');
    var lexique = jsonfile.readFileSync(__dirname + '/../assets/lexique.json');
} catch (e) {
    // Importing xlsb
    var xlsx               = require('node-xlsx');
    var xlsxToJson         = require('./xlsxToJson');
    var lexiqueName        = 'lexique380.xlsb';
    var lexiqueXls         = xlsx.parse(__dirname + '/../assets/' + lexiqueName);
    var sheet              = lexiqueXls[0].data;

    // Construct the usable data, you can modify the method if you want another format
    var lexique = construct(sheet);
    xlsxToJson(lexique); // Save JSON file
}

// Possible sentence construction
var sentenceAvailableConstructions = [
    'PRO:per VER ART:ind NOM ADV AUX ADJ',
    'PRO:per VER ART:def NOM ADV AUX ADJ',
    'PRE ART:def VER ADV ADJ:ind NOM',
    'PRO:per VER PRO:pos NOM',
];

module.exports = {
    generate: function(options) {
        return makeWholeArticle(lexique, options);
    },
    getLexique: function() {
        return lexique;
    }
};

/**
 * Constructs a usable array of data
 * @param  {array} data Raw format data
 * @return {array}      Without extra data
 */
function construct(data) {
    data = data.slice(1); // Remove headers
    var words = [];
    // Retrieves all words and categorizes them
    data.forEach(function(row, key) {
        var word = {};
        interestingColumns.forEach(function(interestingColumn, key) {
            word[interestingColumn.name] = row[interestingColumn.column];
        });
        words.push(word);
    });

    // Reduces the array
    var i = 0;
    return _.reduce(words, function(l, n) {
        if (i === 0) {
            l = {};
            i++;
        }
        if (!_.isArray(l[n[interestingColumns[1].name]])) {
            l[n[interestingColumns[1].name]] = [];
        }
        l[n[interestingColumns[1].name]].push(n[interestingColumns[0].name]);
        return l;
    });
}

/**
 * Generates the whole article
 * @param  {array}  data    Input data
 * @param  {object} options The options
 * @return {object}         The full article
 */
var makeWholeArticle = function(data, options) {
    // Save the options
    var keywords          = options.keywords;
    var numberOfParagraph = options.numberOfParagraph || 4;
    var paragraphLength   = options.paragraphLength || 30;
    var percentOfKeywords = options.percentOfKeywords;

    // Article skeleton
    var article = {
        title: options.title,
        paragraphs: []
    };

    // Generates the paragraphs
    for (var i = 0; i < numberOfParagraph; i++) {
        article.paragraphs.push(makeParagraph(data, paragraphLength, percentOfKeywords));
    }

    // Injects the keywords into the article
    article = keywordsInjection(article, keywords, percentOfKeywords);

    return article;
};

/**
 * Creates a paragraph
 * @param  {array} data Data
 * @return {string}
 */
var makeParagraph = function(data, paragraphLength, percentOfKeywords) {
    // Paragraph skeleton
    var paragraph = {
        subtitle: makeBasicSentence(data, true),
        content: ''
    };

    // Generates the sentences
    for (var i = 0; i < paragraphLength; i++) {
        // 1/3
        if (_.random(0, 2) === 1) {
            paragraph.content += makeComplexSentence(data) + '. ';
        } else {
            paragraph.content += makeBasicSentence(data, true) + '. ';
        }
    }

    // Removes the trailing spaces
    paragraph.content = paragraph.content.slice(0, -1);

    return paragraph;
};

/**
 * Creates a basic sentence
 * @param  {array} data Data
 * @return {string}
 */
var makeBasicSentence = function(data, isCompleteSentence) {
    // Sentence skeleton
    var sentence = '';

    // Retrieves all available types of words (ex: NOM, AUX, VER, ...)
    var types = sentenceAvailableConstructions[_.random(0, sentenceAvailableConstructions.length - 1)].split(' ');

    // Pick a random word of a chosen types array
    types.forEach(function(type, key) {
        sentence += data[type][_.random(0, data[type].length - 1)] + ' ';
    });

    if (isCompleteSentence) {
        sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1); // Add an uppercase to the first letter of the sentence
    }

    // Removes the traling spaces
    sentence = sentence.slice(0, -1);

    return sentence;
};

/**
 * Creates a complex sentence
 * @param  {array} data Data
 * @return {string}
 */
var makeComplexSentence = function(data) {
    // A complex sentence is just two sentences separated by a comma
    return makeBasicSentence(data, true) + ', ' + makeBasicSentence(data, false);
};

/**
 * Injects keywords
 * @param  {object} article           The full article
 * @param  {array}  keywords          The keywords you want to insert
 * @param  {array}  percentOfKeywords The percent of keywords in the whole article
 * @return {object}                   The article with keywords injected
 */
var keywordsInjection = function(article, keywords, percentOfKeywords) {
    // Counts the title words
    var wordCount = article.title.split(' ').length;

    // Counts the words withing a paragraph, including subtitles
    article.paragraphs.forEach(function(paragraph, key) {
        // Counts the subtitle words
        wordCount += paragraph.subtitle.split(' ').length;
        // Counts the content words
        wordCount += paragraph.content.split(' ').length;
    });

    // The number of keywords needed in the article
    var needNumberKeywords = wordCount * percentOfKeywords / 100;

    // Adds the keywords in one subtitle
    keywords.forEach(function(keyword, key) {
        var randParagraph = _.random(0, article.paragraphs.length - 1);
        article.paragraphs[randParagraph].subtitle = injectWord(article.paragraphs[randParagraph].subtitle, keyword);
    });
    needNumberKeywords--;

    // Adds the keywords at random places
    keywords.forEach(function(keyword, key) {
        for (var i = 0; i < needNumberKeywords; i++) {
            var randParagraph = _.random(0, article.paragraphs.length - 1);
            article.paragraphs[randParagraph].content = injectWord(article.paragraphs[randParagraph].content, keyword);
        }
    });

    return article;
};

/**
 * Add a word at a random place in a text
 * @param  {string} text A text
 * @param  {string} word The wod you want to add in the text
 * @return {string}      The text with keywords added
 */
var injectWord = function(text, word) {
    // Define the random place
    var rand = text.indexOf(' ', _.random(0, text.length - 10));
    return text.splice(rand, 0, ' ' + word);
};

// Add splice function, override string class
String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};
