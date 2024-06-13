class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObject = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObject[el]);
    //console.log(queryObject);

    //1B. ADVANCE FILTERING
    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|lte|lt|gt)\b/g, (match) => `$${match}`); //Adding $ to perform operator based filtering lte,gte,gt,lt
    //console.log(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // console.log(this.queryString.sort);
      const sortBy = this.queryString.sort.split(',').join(' ');
      console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); // - means here is decreasing
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      console.log(this.queryString.fields);
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //- means here is excluding that field
    }
    return this;
  }

  pagination() {
    const page = this.queryString.page * 1 || 1; //default set to 1
    const limit = this.queryString.limit * 1 || 100; //default set to 100
    const skip = (page - 1) * limit; //page * limit - limit;

    this.query = this.query.skip(skip).limit(limit);
    // if (this.queryString.page) {
    //   const numofTours = await Tour.countDocuments();
    //   if (skip > numofTours) {
    //     throw new Error('This page does not exist!');
    //   }
    return this;
  }
}

module.exports = APIFeatures;
