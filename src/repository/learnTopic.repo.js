import prisma from '../config/prisma.js'

const learnTopicRepo = {
  findAll() {
    return prisma.learnTopic.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  findById(id) {
    return prisma.learnTopic.findUnique({
      where: {
        id
      }
    })
  },

  create(data) {
    return prisma.learnTopic.create({
      data: {
        name: data.name,
        data: data.data
      }
    })
  },

  update(id, data) {
    return prisma.learnTopic.update({
      where: {
        id
      },
      data: {
        name: data.name,
        data: data.data
      }
    })
  },

  delete(id) {
    return prisma.learnTopic.delete({
      where: {
        id
      }
    })
  }
}

export default learnTopicRepo
