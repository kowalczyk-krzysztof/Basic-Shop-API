import express, { Router } from 'express';

import { getCategories, getCategory } from '../controllers/categories';

const categoryRouter: Router = express.Router();

categoryRouter.route('/list').get(getCategories);
categoryRouter.route('/category/find/:id').get(getCategory);
export default categoryRouter;
