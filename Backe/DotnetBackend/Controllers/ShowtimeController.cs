using Microsoft.AspNetCore.Mvc;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

[ApiController]
[Route("api/showtimes")]
public class ShowtimeController(ShowtimeService showtimeService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await showtimeService.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var detail = await showtimeService.GetDetailAsync(id);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpGet("movie/{movieId:int}")]
    public async Task<IActionResult> GetByMovie(int movieId, [FromQuery] string? date) =>
        Ok(await showtimeService.GetByMovieAsync(movieId, date));

    [HttpGet("date/{date}")]
    public async Task<IActionResult> GetByDate(string date)
    {
        var movies = await showtimeService.GetByDateAsync(date);
        return Ok(movies);
    }

    [HttpGet("{id:int}/seats")]
    public async Task<IActionResult> GetSeatStatuses(int id)
    {
        try
        {
            var seats = await showtimeService.GetSeatStatusesAsync(id);
            return Ok(seats);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
