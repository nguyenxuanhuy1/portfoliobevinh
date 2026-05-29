
import userRepo from "../repository/user.repo"

const userService = {
    async getListUser(){
        return userRepo.findAll();
    },
    async getByGmail(email){
        return userRepo.findByEmail(email)
    }
}