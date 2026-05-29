import prisma from '../config/prisma.js'

const projectRepo = {
  findAll() {
    return prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    })
  },

  findById(id) {
    return prisma.project.findUnique({
      where: { id }
    })
  },

  findByName(name) {
    return prisma.project.findFirst({
      where: { name }
    })
  },

  create(data) {
    const { name, description, image, productLink, githubLink } = data

    return prisma.project.create({
      data: {
        name,
        description,
        image,
        productLink,
        githubLink
      }
    })
  },

  update(id, data) {
    const { name, description, image, productLink, githubLink } = data

    return prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        image,
        productLink,
        githubLink
      }
    })
  },

  delete(id) {
    return prisma.project.delete({
      where: { id }
    })
  }
}

export default projectRepo