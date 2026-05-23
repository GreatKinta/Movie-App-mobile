
const generateSchedule = () => {
    const schedule = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayNum = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const dayOfWeek = date.toLocaleDateString('vi-VN', { weekday: 'short' }); // e.g: "T2", "CN"

        const dayId = `tab-id-${i + 1}`;

        // Randomize showtimes slightly for variety
        const showtimesMatBiec = [
            { time: '18:00', date: `${dayNum}/${month}`, seats: Math.floor(Math.random() * 50) + 10 },
            { time: '20:15', date: `${dayNum}/${month}`, seats: Math.floor(Math.random() * 50) + 10 },
            { time: '22:30', date: `${dayNum}/${month}`, seats: Math.floor(Math.random() * 50) + 10 }
        ];

        const showtimesBoGia = [
            { time: '19:00', date: `${dayNum}/${month}`, seats: Math.floor(Math.random() * 50) + 10 },
            { time: '21:30', date: `${dayNum}/${month}`, seats: Math.floor(Math.random() * 50) + 10 }
        ];

        const movies = [
            {
                id: `mb-${dayId}`,
                title: 'Mắt Biếc',
                imageUrl: '/assets/images/mat-biec.png', // Image provided by user
                ratingUrl: 'https://img.icons8.com/color/48/Age-Rating-13.png', // Placeholder rating icon
                link: '#',
                genre: 'Tình Cảm',
                duration: '117',
                type: '2D Digital',
                showtimes: showtimesMatBiec
            },
            {
                id: `bg-${dayId}`,
                title: 'Bố Già',
                imageUrl: 'https://image.tmdb.org/t/p/w500/uUjEqrS2f88sF9iVfI4wY9T2mC3.jpg', // Valid TMDB Poster
                ratingUrl: 'https://img.icons8.com/color/48/Age-Rating-16.png',
                link: '#',
                genre: 'Gia Đình, Hài',
                duration: '128',
                type: '2D',
                showtimes: showtimesBoGia
            }
        ];

        schedule.push({
            day: {
                id: dayId,
                dayNumber: dayNum,
                monthYear: `/${month} - ${dayOfWeek}`
            },
            movies: movies
        });
    }

    return schedule;
};

export const scheduleData = generateSchedule();
