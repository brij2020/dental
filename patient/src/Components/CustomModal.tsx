import React from 'react'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'

interface CustomModalProps {
  openModal: boolean
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>
  children: React.ReactNode 
}

const CustomModal: React.FC<CustomModalProps> = ({openModal, setOpenModal, children}) => {
  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent aria-describedby={undefined} className='w-fit max-w-[97vw] p-0 '>
            <DialogTitle></DialogTitle>
            {children}
        </DialogContent>
    </Dialog>
  )
}

export default CustomModal