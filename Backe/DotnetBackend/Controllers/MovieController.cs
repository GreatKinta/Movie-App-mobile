using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

[ApiController]
[Route("api/movies")]
public class MovieController(MovieService movieService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var movies = status is not null
            ? await movieService.GetByStatusAsync(status)
            : await movieService.GetAllAsync();
        return Ok(movies);
    }

    [HttpGet("paged")]
    public async Task<IActionResult> GetPaged([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? status = null)
    {
        var result = await movieService.GetPagedAsync(pageNumber, pageSize, search, status);
        return Ok(result);
    }

    [HttpPost("{id:int}/publish")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Publish(int id, [FromQuery] string status = "showing")
    {
        var movie = await movieService.PublishAsync(id, status);
        return movie is null ? NotFound() : Ok(movie);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var movie = await movieService.GetByIdAsync(id);
        return movie is null ? NotFound() : Ok(movie);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateMovieRequest request)
    {
        var movie = await movieService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = movie.MovieId }, movie);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateMovieRequest request)
    {
        var movie = await movieService.UpdateAsync(id, request);
        return movie is null ? NotFound() : Ok(movie);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await movieService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
