var yeoman  = require('yeoman-generator');
var _       = require('lodash');
var util    = require('util');
var path    = require('path');
var textGen = require('./lib/textGenerator');

var NodeGeneratorMochaConnectors = module.exports = function NodeGeneratorMocha(args, options) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({
      bower: false,
      skipInstall: options['skip-install']
    });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};
util.inherits(NodeGeneratorMochaConnectors, yeoman.generators.NamedBase);

NodeGeneratorMochaConnectors.prototype.askFor = function askFor() {
  var cb = this.async();

  console.log(
    this.yeoman +
    '\nThe title of your article should be unique.');

  var prompts = [{
    name: 'title',
    message: 'The article title',
    default: 'A title'
  }, {
    name: 'keywords',
    message: 'The keywords you want to insert (separated by commas without any spaces, ex: toto,tata,tutu)',
    default: 'keyword'
  }, {
    name: 'percent',
    message: 'The percentage of keywords apparition',
    default: 3
  }, {
    name: 'numberOfParagraph',
    message: 'The number of paragraph',
    default: 5
  }, {
    name: 'paragraphLength',
    message: 'The length of a paragraph (number of sentences)',
    default: 35
  }];

  this.currentYear = (new Date()).getFullYear();

  this.prompt(prompts, function (props) {
    this.title = props.title;
    this.slugTitle = slugify(this.title);

    this.keywords = props.keywords;
    this.percent = props.percent;
    this.numberOfParagraph = props.numberOfParagraph;
    this.paragraphLength = props.paragraphLength;

    if (!_.isArray(this.keywords)) {
        this.filename = slugify(this.keywords);
        this.keywords = this.keywords.split(',');
    } else {
        this.filename = slugify(this.keywords.join('-'));
    }

    this.props = props;

    this.options = {
        keywords: this.keywords,
        numberOfParagraph: this.numberOfParagraph,
        paragraphLength: this.paragraphLength,
        percentOfKeywords: this.percent,
        title: this.title
    };

    this.article = textGen.generate(this.options);

    cb();
  }.bind(this));
};

NodeGeneratorMochaConnectors.prototype.lib = function lib() {
  var that = this;

  this.template('article.html', this.slugTitle + '.html');
};


var slugify = function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};
