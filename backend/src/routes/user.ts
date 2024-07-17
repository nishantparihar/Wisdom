import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { signinInput, signupInput } from "@nishantparihar/wisdom-common";


const user = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        jwt_secret: string
    }
}>()



user.post('/signup', async (c) => {
    const body = await c.req.json();
    const { success } = signupInput.safeParse(body);

    if(!success){
      c.status(411);
      return c.json({
        msg: "Wrong Inputs"
      })
    }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{
      const res = await prisma.user.create({
        data:{
          email: body.email,
          name: body.name,
          password: body.password
        }
      })
      
      const jwt = await sign({id: res.id}, c.env.jwt_secret)
      return c.json({
        "jwt": "Bearer " + jwt
      })
    }
    catch(e){
      c.status(411);
      return c.text("Error while registering user")
    }
  
})
  
  
user.post('/signin',async (c)=>{
  
    const body = await c.req.json();
   
    const { success } = signinInput.safeParse(body);

    if(!success){
      c.status(411);
      return c.json({ 
        msg: "Wrong Inputs"
      })
    }

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())
   
    try{
        const res = await prisma.user.findUnique({
        where: {
            email: body.email,
            password: body.password
        }
        })
      
        if(!res){
        c.status(403);
        return c.text("Wrong username or password")
        }

        const jwt = await sign({id: res?.id}, c.env.jwt_secret)
        return c.json({
        "jwt": "Bearer " + jwt
        })
    }
    catch(e){
        c.status(411);
        return c.text("Error while signing in")
    }
  
})
  


export default user;