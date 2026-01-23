import React, { useState } from 'react'
import ReviewCard from './ReviewCard'
import type { Review } from '@/services/types'

interface ReviewProps {
  reviews: Review[],
}

const ClinicReviews: React.FC<ReviewProps> = ({ reviews }) => {
  const [showReviews, setShowReviews] = useState(false)

  return (
    <div className='mt-5 flex flex-col gap-4'>
      <div className='flex items-center gap-1 cursor-pointer' onClick={() => setShowReviews(!showReviews)}>
        <h4 className='font-semibold text-base'>Ratings & Reviews ({reviews.length})</h4>
        <span className={`material-symbols-sharp text-gray-500 transition transform duration-300 ${showReviews && "rotate-180"}`}>keyboard_arrow_down</span>
      </div>
      {
        showReviews && (
          <div className='max-h-[370px] custom-scrollbar overflow-y-auto'>
            {
              reviews && reviews.length > 0 ? (
                <div className='columns-1 md:columns-2 xl:columns-3 gap-2.5'>
                  {
                    reviews.map((review, index) => (
                      <ReviewCard key={index} review={review} />
                    ))
                  }
                </div>
              ) : (
                <p className='text-xs font-semibold text-gray-500'>No reviews yet!</p>
              )
            }

          </div>
        )
      }

    </div>
  )
}

export default ClinicReviews