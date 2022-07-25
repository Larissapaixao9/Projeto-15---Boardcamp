export default function formateDateFunction(date) {
    return [
        date.getFullYear(),
        twoDigits(date.getMonth() + 1),
        twoDigits(date.getDate())
    ].join('-');
};