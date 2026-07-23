import slugify from 'slugify';

function capitalize(str) {
  return str.charAt(0).toLocaleUpperCase() + str.slice(1);
}

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    if (this.queryString.startDate)
      queryObj.startDate = new Date(this.queryString.startDate);

    if (this.queryString.eventLocation) {
      this.query = this.query.find({
        'eventLocation.city': capitalize(queryObj.eventLocation),
      });
      delete queryObj['eventLocation'];
    }

    if (this.queryString.eventName) {
      queryObj.slug = slugify(queryObj.eventName, { lower: true });
      delete queryObj['eventName'];
    }

    // Advanced filtering: convert gte|gt|lte|lt to MongoDB operators
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else this.query = this.query.sort('startDate');

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else
      this.query = this.query.select(
        '_id slug eventName startDate startTime endDate endTime eventLocation coverImage totalQuantity timezone salesStartDate salesEndDate numberOfAttendees',
      );

    return this;
  }

  populate(path, select) {
    this.query = this.query.populate({ path, select });
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 6;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;
