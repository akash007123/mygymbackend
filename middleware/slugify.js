const slugify = require('slugify');

const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
};

const slugifyMiddleware = (model) => {
  return async function(next) {
    if (this.isModified('title') || this.isModified('name')) {
      const field = this.title ? 'title' : 'name';
      let baseSlug = generateSlug(this[field]);
      let slug = baseSlug;
      let counter = 1;

      // Check for uniqueness
      while (await model.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      this.slug = slug;
    }
    next();
  };
};

module.exports = { generateSlug, slugifyMiddleware };