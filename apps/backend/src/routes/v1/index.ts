import { Router } from 'express';
import { authRouter } from '../auth';
import { notesRouter } from '../notes';
import templatesRouter from '../templates';
import foldersRouter from '../folders';
import sharesRouter from '../shares';
import exportRouter from '../export';
import { searchRouter } from '../search';

const v1Router: Router = Router();

// Mount all v1 routes
v1Router.use('/auth', authRouter);
v1Router.use('/notes', notesRouter);
v1Router.use('/templates', templatesRouter);
v1Router.use('/folders', foldersRouter);
v1Router.use('/shares', sharesRouter);
v1Router.use('/export', exportRouter);
v1Router.use('/search', searchRouter);

export default v1Router;
