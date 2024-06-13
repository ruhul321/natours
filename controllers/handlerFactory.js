const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document) {
      return next(
        new AppError(`There is no document with this ${req.params.id} ID`, 404),
      );
    }
    res.status(204).json({
      status: 'success',
      data: 'Deleted successfully',
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // console.log(req.body);
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!document) {
      return next(
        new AppError(`There is no document with this ${req.params.id} ID`, 404),
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);
    // console.log(document);
    res.status(201).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    // console.log(popOptions);
    if (popOptions) query = query.populate(popOptions);
    const document = await query;
    if (!document) {
      return next(
        new AppError(`There is no document with this ${req.params.id} ID`, 404),
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow for Nested GET reviews on tours
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: doc.length,
      data: { data: doc },
    });
  });
