import catchAsync from '../utils/catchAsync.js';
import * as documentService from '../services/documentService.js';

export const getDocuments = catchAsync(async (req, res) => {
  const result = await documentService.getDocuments(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getDocumentStats = catchAsync(async (req, res) => {
  const stats = await documentService.getDocumentStats();
  res.status(200).json({ success: true, data: stats });
});

export const getExpiringDocuments = catchAsync(async (req, res) => {
  const documents = await documentService.getExpiringDocuments(req.query);
  res.status(200).json({ success: true, data: documents });
});

export const getDocumentAnalytics = catchAsync(async (req, res) => {
  const analytics = await documentService.getDocumentAnalytics();
  res.status(200).json({ success: true, data: analytics });
});

export const getMetaVehicles = catchAsync(async (req, res) => {
  const vehicles = await documentService.getMetaVehicles();
  res.status(200).json({ success: true, data: vehicles });
});

export const getMetaDrivers = catchAsync(async (req, res) => {
  const drivers = await documentService.getMetaDrivers();
  res.status(200).json({ success: true, data: drivers });
});

export const getDocument = catchAsync(async (req, res) => {
  const document = await documentService.getDocumentById(req.params.id);
  res.status(200).json({ success: true, data: { document } });
});

export const createDocument = catchAsync(async (req, res) => {
  const document = await documentService.createDocument(req.file, req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Document uploaded successfully', data: { document } });
});

export const updateDocument = catchAsync(async (req, res) => {
  const document = await documentService.updateDocument(req.params.id, req.body, req.user._id);
  res.status(200).json({ success: true, message: 'Document updated successfully', data: { document } });
});

export const replaceDocumentFile = catchAsync(async (req, res) => {
  const document = await documentService.replaceDocumentFile(req.params.id, req.file, req.user._id);
  res.status(200).json({ success: true, message: 'Document file replaced successfully', data: { document } });
});

export const deleteDocument = catchAsync(async (req, res) => {
  const result = await documentService.deleteDocument(req.params.id, req.user._id);
  res.status(200).json({ success: true, ...result });
});

export const downloadDocument = catchAsync(async (req, res) => {
  const document = await documentService.getDocumentById(req.params.id);
  res.status(200).json({
    success: true,
    data: {
      downloadUrl: document.fileUrl,
      fileName: document.fileName,
      mimeType: document.mimeType,
    },
  });
});

export const exportDocuments = catchAsync(async (req, res) => {
  const csv = await documentService.exportDocumentsCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=documents-${Date.now()}.csv`);
  res.status(200).send(csv);
});
