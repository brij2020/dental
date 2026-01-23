
type promisifierProps = Date[]

export function dateAPI(data:promisifierProps):Promise<Date[]>{
  return new Promise((resolve)=>{
    setTimeout(()=>{
      resolve(data)
    }, 3000)
  })
}