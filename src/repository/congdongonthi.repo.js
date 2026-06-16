import prisma from '../config/prisma.js';

const congDongOnThiRepo = {
  findAll() {
    return prisma.document.findMany({
      select: {
        id: true,
        subject: true,
        title: true,
        description: true,
        downloads: true,
        fileType: true,
        fileSize: true,
        tags: true,
        views: true,
        level: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  findById(id) {
    return prisma.document.findUnique({
      where: { id }
    });
  },

  create(data) {
    return prisma.document.create({
      data
    });
  },

  update(id, data) {
    return prisma.document.update({
      where: { id },
      data
    });
  },

  delete(id) {
    return prisma.document.delete({
      where: { id }
    });
  },

  countByDownloadUrlExceptId(downloadUrl, id) {
    return prisma.document.count({
      where: {
        downloadUrl: {
          hasSome: downloadUrl
        },
        id: { not: id }
      }
    });
  },

  resetHotDocuments() {
    return prisma.document.updateMany({
      where: { level: 1 },
      data: { level: 0 }
    });
  },

  findDistinctSubjects() {
    return prisma.document.findMany({
      select: { subject: true },
      distinct: ['subject']
    });
  }
};

export default congDongOnThiRepo;
