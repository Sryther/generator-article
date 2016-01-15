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

// If file exists, we will use it, else we build it.
try {
    fs.accessSync(__dirname + '/../assets/lexique.json', fs.F_OK);
    var jsonfile = require('jsonfile');
    var lexique = jsonfile.readFileSync(__dirname + '/../assets/lexique.json');
} catch (e) {
    var xlsx               = require('node-xlsx');
    var xlsxToJson         = require('./xlsxToJson');
    var lexiqueName        = 'lexique380.xlsb';
    var lexiqueXls         = xlsx.parse(__dirname + '/../assets/' + lexiqueName);
    var sheet              = lexiqueXls[0].data;

    var lexique = construct(sheet);
    xlsxToJson(lexique);
}

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
    data.forEach(function(row, key) {
        var word = {};
        interestingColumns.forEach(function(interestingColumn, key) {
            word[interestingColumn.name] = row[interestingColumn.column];
        });
        words.push(word);
    });
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

var makeWholeArticle = function(data, options) {
    var keywords          = options.keywords;
    var numberOfParagraph = options.numberOfParagraph || 4;
    var paragraphLength   = options.paragraphLength || 30;
    var percentOfKeywords = options.percentOfKeywords;

    var article = {
        title: options.title,
        paragraphs: []
    };

    for (var i = 0; i < numberOfParagraph; i++) {
        article.paragraphs.push(makeParagraph(data, paragraphLength, percentOfKeywords));
    }

    article = keywordsInjection(article, keywords, percentOfKeywords);

    return article;
};

/**
 * Creates a paragraph
 * @param  {array} data Data
 * @return {string}
 */
var makeParagraph = function(data, paragraphLength, percentOfKeywords) {
    var paragraph = {
        subtitle: makeBasicSentence(data, true),
        content: ''
    };
    for (var i = 0; i < paragraphLength; i++) {
        // 1/3
        if (_.random(0, 2) === 1) {
            paragraph.content += makeComplexSentence(data) + '. ';
        } else {
            paragraph.content += makeBasicSentence(data, true) + '. ';
        }
    }

    paragraph.content = paragraph.content.slice(0, -1);

    return paragraph; // Remove trailing space
};

/**
 * Creates a basic sentence
 * @param  {array} data Data
 * @return {string}
 */
var makeBasicSentence = function(data, isCompleteSentence) {
    var sentence = '';
    var types = sentenceAvailableConstructions[_.random(0, sentenceAvailableConstructions.length - 1)].split(' ');
    types.forEach(function(type, key) {
        sentence += data[type][_.random(0, data[type].length - 1)] + ' ';
    });

    if (isCompleteSentence) {
        sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }

    sentence = sentence.slice(0, -1); // Remove trailing space

    return sentence;
};

/**
 * Creates a complex sentence
 * @param  {array} data Data
 * @return {string}
 */
var makeComplexSentence = function(data) {
    return makeBasicSentence(data, true) + ', ' + makeBasicSentence(data, false);
};

/**
 * Injects keywords
 * @param  {object} article           [description]
 * @param  {[type]} keywords          [description]
 * @param  {[type]} percentOfKeywords [description]
 * @return {[type]}                   [description]
 */
var keywordsInjection = function(article, keywords, percentOfKeywords) {
    var wordCount = article.title.split(' ').length; // Title word count
    article.paragraphs.forEach(function(paragraph, key) {
        wordCount += paragraph.subtitle.split(' ').length; // Subtitle word count
        wordCount += paragraph.content.split(' ').length; // Content word count
    });

    console.log(wordCount);
    var needNumberKeywords = wordCount * percentOfKeywords / 100;

    keywords.forEach(function(keyword, key) {
        var randParagraph = _.random(0, article.paragraphs.length - 1);
        article.paragraphs[randParagraph].subtitle = injectWord(article.paragraphs[randParagraph].subtitle, keyword);
    });
    needNumberKeywords--;

    keywords.forEach(function(keyword, key) {
        for (var i = 0; i < needNumberKeywords; i++) {
            var randParagraph = _.random(0, article.paragraphs.length - 1);
            article.paragraphs[randParagraph].content = injectWord(article.paragraphs[randParagraph].content, keyword);
        }
    });

    return article;
};

var injectWord = function(text, word) {
    var rand = text.indexOf(' ', _.random(0, text.length - 10));
    return text.splice(rand, 0, ' ' + word);
};

// Aqdd splice function
String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};
