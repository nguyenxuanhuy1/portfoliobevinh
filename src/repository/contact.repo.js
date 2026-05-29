import prisma from '../config/prisma.js'

const contactRepo = {
  findAll() {
    return prisma.contact.findMany({
      orderBy: { createdAt: 'desc' }
    })
  },

  findById(id) {
    return prisma.contact.findUnique({
      where: { id }
    })
  },

  create(data) {
    const { name, link } = data
    return prisma.contact.create({
      data: { name, link }
    })
  },

  update(id, data) {
    const { name, link } = data
    return prisma.contact.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(link !== undefined && { link })
      }
    })
  },

  delete(id) {
    return prisma.contact.delete({
      where: { id }
    })
  }
}

export default contactRepo
